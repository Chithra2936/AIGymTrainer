export type ExerciseId = 'squat' | 'bicep_curl' | 'pushup' | 'lunge' | 'shoulder_press';

export interface ExerciseConfig {
  id: ExerciseId;
  name: string;
  description: string;
  instructions: string[];
  primaryJoint: JointId;
  downAngle: number;
  upAngle: number;
  formFeedback: FormFeedbackRule[];
  icon: string;
  accentColor: string;
}

export type JointId =
  | 'left_elbow'
  | 'right_elbow'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee';

export interface FormFeedbackRule {
  joint: JointId;
  minAngle?: number;
  maxAngle?: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface RepState {
  count: number;
  phase: 'up' | 'down';
  correctCount: number;
  incorrectCount: number;
  formScores: number[];
}

export interface WorkoutSession {
  id: string;
  exercise: string;
  total_reps: number;
  correct_reps: number;
  incorrect_reps: number;
  duration_seconds: number;
  avg_form_score: number;
  created_at: string;
}

export interface FeedbackMessage {
  text: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  id: number;
}
