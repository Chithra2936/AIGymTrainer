import type { ExerciseConfig, ExerciseId } from '../types';

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'squat',
    name: 'Squats',
    description: 'Lower body strength and mobility',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep your back straight and chest up',
      'Lower until your knees reach about 90 degrees',
      'Push through your heels to stand back up',
    ],
    primaryJoint: 'left_knee',
    downAngle: 160,
    upAngle: 90,
    formFeedback: [
      {
        joint: 'left_hip',
        minAngle: 160,
        message: 'Keep your back straighter — avoid hunching forward',
        severity: 'warning',
      },
    ],
    icon: 'squat',
    accentColor: '#22d3ee',
  },
  {
    id: 'bicep_curl',
    name: 'Bicep Curls',
    description: 'Arm strength and definition',
    instructions: [
      'Stand upright with arms at your sides',
      'Curl your forearm up toward your shoulder',
      'Keep your upper arm stationary',
      'Lower slowly back to the starting position',
    ],
    primaryJoint: 'left_elbow',
    downAngle: 160,
    upAngle: 50,
    formFeedback: [
      {
        joint: 'left_shoulder',
        minAngle: 0,
        maxAngle: 30,
        message: 'Keep your upper arm still — avoid swinging',
        severity: 'warning',
      },
    ],
    icon: 'curl',
    accentColor: '#f59e0b',
  },
  {
    id: 'pushup',
    name: 'Push-Ups',
    description: 'Upper body and core strength',
    instructions: [
      'Start in a plank position with arms straight',
      'Keep your body in a straight line',
      'Lower your chest toward the floor',
      'Push back up to the starting position',
    ],
    primaryJoint: 'left_elbow',
    downAngle: 160,
    upAngle: 90,
    formFeedback: [
      {
        joint: 'left_hip',
        minAngle: 160,
        message: 'Keep your body straight — avoid sagging hips',
        severity: 'warning',
      },
    ],
    icon: 'pushup',
    accentColor: '#ef4444',
  },
  {
    id: 'lunge',
    name: 'Lunges',
    description: 'Leg strength and balance',
    instructions: [
      'Stand upright with feet hip-width apart',
      'Step forward and lower your back knee',
      'Keep your front knee aligned over your ankle',
      'Push back to the starting position',
    ],
    primaryJoint: 'left_knee',
    downAngle: 170,
    upAngle: 90,
    formFeedback: [
      {
        joint: 'left_hip',
        minAngle: 160,
        message: 'Keep your torso upright — avoid leaning forward',
        severity: 'warning',
      },
    ],
    icon: 'lunge',
    accentColor: '#84cc16',
  },
  {
    id: 'shoulder_press',
    name: 'Shoulder Press',
    description: 'Shoulder and upper body strength',
    instructions: [
      'Start with arms bent at shoulder height',
      'Press your arms straight up overhead',
      'Keep your core engaged and back straight',
      'Lower slowly back to shoulder height',
    ],
    primaryJoint: 'left_elbow',
    downAngle: 90,
    upAngle: 160,
    formFeedback: [
      {
        joint: 'left_hip',
        minAngle: 160,
        message: 'Keep your core engaged — avoid arching your back',
        severity: 'warning',
      },
    ],
    icon: 'press',
    accentColor: '#a78bfa',
  },
];

export function getExercise(id: ExerciseId): ExerciseConfig {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0];
}
