import { useEffect, useRef, useState, useCallback } from 'react';
import type { ExerciseId, FeedbackMessage } from '../types';
import { getExercise } from '../lib/exercises';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { saveWorkout } from '../lib/supabase';

interface WorkoutSessionProps {
  exerciseId: ExerciseId;
  onExit: () => void;
  onFinish: () => void;
}

export function WorkoutSession({ exerciseId, onExit, onFinish }: WorkoutSessionProps) {
  const exercise = getExercise(exerciseId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const { repState, currentAngle, formScore, feedbackMessages, isModelLoading, modelError, retryModelLoad } =
    usePoseDetection({ exercise, isActive, videoRef, canvasRef });

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch {
      setCameraError(
        'Could not access your camera. Please allow camera permissions and try again.'
      );
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    setIsActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const avgScore =
        repState.formScores.length > 0
          ? Math.round(repState.formScores.reduce((a, b) => a + b, 0) / repState.formScores.length)
          : 0;
      await saveWorkout({
        exercise: exercise.id,
        total_reps: repState.count,
        correct_reps: repState.correctCount,
        incorrect_reps: repState.incorrectCount,
        duration_seconds: elapsed,
        avg_form_score: avgScore,
      });
      setSaved(true);
      stopCamera();
      setTimeout(() => onFinish(), 1200);
    } catch {
      setSaving(false);
    }
  };

  const handleExit = () => {
    stopCamera();
    onExit();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="workout-session">
      <div className="workout-header">
        <button className="btn-back" onClick={handleExit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="workout-header-info">
          <h1 className="workout-title" style={{ color: exercise.accentColor }}>
            {exercise.name}
          </h1>
          <p className="workout-subtitle">{exercise.description}</p>
        </div>
        <div className="workout-timer">
          <span className="workout-timer-value">{formatTime(elapsed)}</span>
          <span className="workout-timer-label">Duration</span>
        </div>
      </div>

      <div className="workout-body">
        <div className="workout-video-area">
          <div className="video-container">
            <video ref={videoRef} className="video-feed" playsInline muted />
            <canvas ref={canvasRef} className="video-overlay" />

            {!isActive && !cameraError && !saved && (
              <div className="video-overlay-content">
                <button className="btn-start-camera" onClick={startCamera}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Start Camera
                </button>
                {isModelLoading && <p className="model-loading-text">Loading AI model...</p>}
                {modelError && (
                  <div className="model-error-box">
                    <p className="model-error-text">{modelError}</p>
                    <button className="btn-retry" onClick={retryModelLoad}>Retry loading model</button>
                  </div>
                )}
              </div>
            )}

            {cameraError && (
              <div className="video-overlay-content">
                <div className="camera-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <p>{cameraError}</p>
                  <button className="btn-retry" onClick={startCamera}>Try Again</button>
                </div>
              </div>
            )}

            {saved && (
              <div className="video-overlay-content">
                <div className="save-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <p>Workout saved!</p>
                </div>
              </div>
            )}

            {isActive && (
              <div className="feedback-toast-container">
                {feedbackMessages.map((msg: FeedbackMessage) => (
                  <div key={msg.id} className={`feedback-toast feedback-${msg.severity}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isActive && (
            <div className="workout-controls">
              <button className="btn-stop" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Finish & Save'}
              </button>
              <button className="btn-cancel" onClick={handleExit}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="workout-sidebar">
          <div className="rep-counter-card" style={{ '--exercise-color': exercise.accentColor } as React.CSSProperties}>
            <div className="rep-counter-display">
              <span className="rep-counter-number">{repState.count}</span>
              <span className="rep-counter-label">Reps</span>
            </div>
            <div className="rep-counter-phase">
              <span className={`phase-indicator ${repState.phase}`}>
                {repState.phase === 'up' ? 'UP' : 'DOWN'}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Joint Angle</span>
              <span className="metric-value">{currentAngle}°</span>
            </div>
            <div className="angle-bar">
              <div
                className="angle-bar-fill"
                style={{
                  width: `${Math.min(100, (currentAngle / 180) * 100)}%`,
                  background: exercise.accentColor,
                }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-label">Form Score</span>
              <span className={`metric-value ${formScore >= 70 ? 'good' : 'poor'}`}>
                {formScore}%
              </span>
            </div>
            <div className="form-bar">
              <div
                className={`form-bar-fill ${formScore >= 70 ? 'good' : 'poor'}`}
                style={{ width: `${formScore}%` }}
              />
            </div>
          </div>

          <div className="rep-breakdown">
            <div className="rep-breakdown-item good">
              <span className="rep-breakdown-value">{repState.correctCount}</span>
              <span className="rep-breakdown-label">Good Form</span>
            </div>
            <div className="rep-breakdown-divider" />
            <div className="rep-breakdown-item bad">
              <span className="rep-breakdown-value">{repState.incorrectCount}</span>
              <span className="rep-breakdown-label">Needs Work</span>
            </div>
          </div>

          <div className="instructions-card">
            <h3 className="instructions-title">How to perform</h3>
            <ul className="instructions-list">
              {exercise.instructions.map((inst, i) => (
                <li key={i}>
                  <span className="instructions-number">{i + 1}</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
