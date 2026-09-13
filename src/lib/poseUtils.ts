import type { ExerciseConfig, JointId, RepState } from '../types';

// MediaPipe PoseLandmark indices
export const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type Landmarks = Landmark[];

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

const JOINT_LANDMARKS: Record<
  JointId,
  { a: number; b: number; c: number }
> = {
  left_elbow: {
    a: LANDMARKS.LEFT_SHOULDER,
    b: LANDMARKS.LEFT_ELBOW,
    c: LANDMARKS.LEFT_WRIST,
  },
  right_elbow: {
    a: LANDMARKS.RIGHT_SHOULDER,
    b: LANDMARKS.RIGHT_ELBOW,
    c: LANDMARKS.RIGHT_WRIST,
  },
  left_shoulder: {
    a: LANDMARKS.LEFT_ELBOW,
    b: LANDMARKS.LEFT_SHOULDER,
    c: LANDMARKS.LEFT_HIP,
  },
  right_shoulder: {
    a: LANDMARKS.RIGHT_ELBOW,
    b: LANDMARKS.RIGHT_SHOULDER,
    c: LANDMARKS.RIGHT_HIP,
  },
  left_hip: {
    a: LANDMARKS.LEFT_SHOULDER,
    b: LANDMARKS.LEFT_HIP,
    c: LANDMARKS.LEFT_KNEE,
  },
  right_hip: {
    a: LANDMARKS.RIGHT_SHOULDER,
    b: LANDMARKS.RIGHT_HIP,
    c: LANDMARKS.RIGHT_KNEE,
  },
  left_knee: {
    a: LANDMARKS.LEFT_HIP,
    b: LANDMARKS.LEFT_KNEE,
    c: LANDMARKS.LEFT_ANKLE,
  },
  right_knee: {
    a: LANDMARKS.RIGHT_HIP,
    b: LANDMARKS.RIGHT_KNEE,
    c: LANDMARKS.RIGHT_ANKLE,
  },
};

export function getJointAngle(landmarks: Landmarks, joint: JointId): number {
  const { a, b, c } = JOINT_LANDMARKS[joint];
  const la = landmarks[a];
  const lb = landmarks[b];
  const lc = landmarks[c];
  if (!la || !lb || !lc) return 0;
  if (la.visibility < 0.3 || lb.visibility < 0.3 || lc.visibility < 0.3) return 0;
  return calculateAngle(la, lb, lc);
}

export function createRepState(): RepState {
  return {
    count: 0,
    phase: 'up',
    correctCount: 0,
    incorrectCount: 0,
    formScores: [],
  };
}

export function updateRepCount(
  state: RepState,
  currentAngle: number,
  config: ExerciseConfig,
  formScore: number
): RepState {
  const newState: RepState = {
    ...state,
    formScores: [...state.formScores],
  };

  const isShoulderPress = config.id === 'shoulder_press';

  if (isShoulderPress) {
    // For shoulder press: start down (arms at 90), go up (arms straight at 160)
    if (state.phase === 'down' && currentAngle > config.upAngle + 5) {
      newState.phase = 'up';
      newState.count = state.count + 1;
      if (formScore >= 70) {
        newState.correctCount = state.correctCount + 1;
      } else {
        newState.incorrectCount = state.incorrectCount + 1;
      }
      newState.formScores = [...state.formScores, formScore];
    } else if (state.phase === 'up' && currentAngle < config.downAngle - 5) {
      newState.phase = 'down';
    }
  } else {
    // Standard: start up (straight), go down (bent), come back up
    if (state.phase === 'up' && currentAngle < config.upAngle + 5) {
      newState.phase = 'down';
    } else if (state.phase === 'down' && currentAngle > config.downAngle - 5) {
      newState.phase = 'up';
      newState.count = state.count + 1;
      if (formScore >= 70) {
        newState.correctCount = state.correctCount + 1;
      } else {
        newState.incorrectCount = state.incorrectCount + 1;
      }
      newState.formScores = [...state.formScores, formScore];
    }
  }

  return newState;
}

export function checkForm(
  landmarks: Landmarks,
  config: ExerciseConfig
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  for (const rule of config.formFeedback) {
    const angle = getJointAngle(landmarks, rule.joint);
    if (angle === 0) continue;

    if (rule.minAngle !== undefined && angle < rule.minAngle) {
      issues.push(rule.message);
      score -= 20;
    }
    if (rule.maxAngle !== undefined && angle > rule.maxAngle) {
      issues.push(rule.message);
      score -= 20;
    }
  }

  return { score: Math.max(0, score), issues };
}

export function getAvgFormScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
];
