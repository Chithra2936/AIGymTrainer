import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { ExerciseConfig, FeedbackMessage, RepState, ClassificationResult, ModelStatus } from '../types';
import {
  checkForm,
  createRepState,
  getJointAngle,
  SKELETON_CONNECTIONS,
  updateRepCount,
  type Landmarks,
} from '../lib/poseUtils';
import { formClassifier } from '../lib/formClassifier';

interface UsePoseDetectionProps {
  exercise: ExerciseConfig;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface UsePoseDetectionReturn {
  repState: RepState;
  currentAngle: number;
  formScore: number;
  feedbackMessages: FeedbackMessage[];
  isModelLoading: boolean;
  modelError: string | null;
  retryModelLoad: () => void;
  mlStatus: ModelStatus;
  classification: ClassificationResult | null;
}

export function usePoseDetection({
  exercise,
  isActive,
  videoRef,
  canvasRef,
}: UsePoseDetectionProps): UsePoseDetectionReturn {
  const [repState, setRepState] = useState<RepState>(createRepState());
  const [currentAngle, setCurrentAngle] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>(
    []
  );
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [mlStatus, setMlStatus] = useState<ModelStatus>('untrained');
  const [classification, setClassification] = useState<ClassificationResult | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const repStateRef = useRef<RepState>(createRepState());
  const rafRef = useRef<number>(0);
  const feedbackIdRef = useRef(0);
  const lastFeedbackRef = useRef<string | null>(null);
  const lastFeedbackTimeRef = useRef(0);
  const videoTimeRef = useRef(0);
  const cancelledRef = useRef(false);
  const loadAttemptRef = useRef(0);

  const loadModel = useCallback(async () => {
    cancelledRef.current = false;
    loadAttemptRef.current += 1;
    const attempt = loadAttemptRef.current;
    setModelError(null);
    setIsModelLoading(true);

    const wasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
    const modelUrl =
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

    for (const delegate of ['GPU', 'CPU'] as const) {
      if (cancelledRef.current || attempt !== loadAttemptRef.current) return;
      try {
        const vision = await FilesetResolver.forVisionTasks(wasmUrl);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelUrl, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelledRef.current || attempt !== loadAttemptRef.current) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setIsModelLoading(false);
        return;
      } catch {
        // try next delegate
      }
    }

    if (!cancelledRef.current && attempt === loadAttemptRef.current) {
      setModelError('Failed to load the pose detection model. Check your internet connection and try again.');
      setIsModelLoading(false);
    }
  }, []);

  // Load the PoseLandmarker model on mount
  useEffect(() => {
    loadModel();
    const unsub = formClassifier.onStatusChange((status) => setMlStatus(status));
    formClassifier.train();
    return () => {
      cancelledRef.current = true;
      unsub();
      formClassifier.dispose();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loadModel]);

  // Reset state when exercise changes
  useEffect(() => {
    repStateRef.current = createRepState();
    setRepState(createRepState());
    setFormScore(100);
    setFeedbackMessages([]);
    lastFeedbackRef.current = null;
  }, [exercise.id]);

  const addFeedback = useCallback((text: string, severity: FeedbackMessage['severity']) => {
    const now = performance.now();
    if (lastFeedbackRef.current === text && now - lastFeedbackTimeRef.current < 2000) {
      return;
    }
    lastFeedbackRef.current = text;
    lastFeedbackTimeRef.current = now;

    const id = feedbackIdRef.current++;
    const msg: FeedbackMessage = { text, severity, id };
    setFeedbackMessages((prev) => [...prev.slice(-3), msg]);
    setTimeout(() => {
      setFeedbackMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  const drawSkeleton = useCallback(
    (landmarks: Landmarks) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.lineWidth = 3;
      ctx.strokeStyle = exercise.accentColor;
      for (const [a, b] of SKELETON_CONNECTIONS) {
        const la = landmarks[a];
        const lb = landmarks[b];
        if (!la || !lb || la.visibility < 0.3 || lb.visibility < 0.3) continue;
        ctx.beginPath();
        ctx.moveTo(la.x * canvas.width, la.y * canvas.height);
        ctx.lineTo(lb.x * canvas.width, lb.y * canvas.height);
        ctx.stroke();
      }

      // Draw joints
      ctx.fillStyle = '#ffffff';
      for (const lm of landmarks) {
        if (lm.visibility < 0.3) continue;
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [canvasRef, videoRef, exercise.accentColor]
  );

  // Detection loop
  useEffect(() => {
    if (!isActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const detect = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      const videoTime = Math.floor(now * 1000);
      if (videoTime === videoTimeRef.current) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      videoTimeRef.current = videoTime;

      let result: PoseLandmarkerResult | null = null;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      if (result && result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0] as Landmarks;
        drawSkeleton(landmarks);

        const angle = getJointAngle(landmarks, exercise.primaryJoint);
        setCurrentAngle(Math.round(angle));

        const { score, issues } = checkForm(landmarks, exercise);
        setFormScore(score);

        // ML classification
        if (formClassifier.getStatus() === 'ready') {
          const result = formClassifier.classify(landmarks, exercise.id);
          setClassification(result);
        }

        if (issues.length > 0) {
          addFeedback(issues[0], 'warning');
        } else if (score === 100 && repStateRef.current.phase === 'down') {
          addFeedback('Good form!', 'success');
        }

        const prevCount = repStateRef.current.count;
        const newState = updateRepCount(
          repStateRef.current,
          angle,
          exercise,
          score
        );
        repStateRef.current = newState;
        setRepState(newState);

        if (newState.count > prevCount && newState.count > 0) {
          addFeedback(`Rep ${newState.count}!`, 'success');
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, exercise, videoRef, canvasRef, drawSkeleton, addFeedback]);

  return {
    repState: { ...repState, formScores: repState.formScores },
    currentAngle,
    formScore,
    feedbackMessages,
    isModelLoading,
    modelError,
    retryModelLoad: loadModel,
    mlStatus,
    classification,
  };
}
