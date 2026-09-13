import type { WorkoutSession, ExerciseId, ExerciseConfig } from '../types';
import { EXERCISES } from './exercises';

export interface AIInsight {
  type: 'strength' | 'improvement' | 'streak' | 'balance';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface AIRecommendation {
  exerciseId: ExerciseId;
  exerciseName: string;
  reason: string;
  targetReps: number;
  focusArea: string;
  confidence: number;
  accentColor: string;
}

export interface AIAnalysis {
  insights: AIInsight[];
  recommendation: AIRecommendation | null;
  progressTrend: 'improving' | 'stable' | 'declining' | 'new';
  weeklyVolume: number;
  predictedWeeklyReps: number;
}

export function analyzeWorkouts(workouts: WorkoutSession[]): AIAnalysis {
  if (workouts.length === 0) {
    return {
      insights: [
        {
          type: 'balance',
          title: 'Start Your Journey',
          description: 'Complete your first workout to unlock AI-powered insights and personalized recommendations.',
          icon: 'spark',
          color: '#22d3ee',
        },
      ],
      recommendation: null,
      progressTrend: 'new',
      weeklyVolume: 0,
      predictedWeeklyReps: 0,
    };
  }

  const insights: AIInsight[] = [];
  const exerciseStats = getExerciseStats(workouts);
  const recentWorkouts = workouts.slice(0, 10);
  const olderWorkouts = workouts.slice(10, 20);

  // Trend analysis
  const recentAvgScore =
    recentWorkouts.reduce((s, w) => s + w.avg_form_score, 0) / recentWorkouts.length;
  const olderAvgScore =
    olderWorkouts.length > 0
      ? olderWorkouts.reduce((s, w) => s + w.avg_form_score, 0) / olderWorkouts.length
      : recentAvgScore;

  let progressTrend: AIAnalysis['progressTrend'] = 'stable';
  if (recentAvgScore > olderAvgScore + 5) progressTrend = 'improving';
  else if (recentAvgScore < olderAvgScore - 5) progressTrend = 'declining';

  // Strength insight
  const bestExercise = exerciseStats.reduce(
    (best, curr) => (curr.avgScore > best.avgScore ? curr : best),
    exerciseStats[0]
  );

  if (bestExercise && bestExercise.avgScore >= 70) {
    insights.push({
      type: 'strength',
      title: `Strong at ${bestExercise.name}`,
      description: `Your form accuracy on ${bestExercise.name.toLowerCase()} is ${Math.round(bestExercise.avgScore)}% — your best exercise. Keep it up!`,
      icon: 'trophy',
      color: '#34d399',
    });
  }

  // Improvement insight
  const worstExercise = exerciseStats.reduce(
    (worst, curr) => (curr.avgScore < worst.avgScore ? curr : worst),
    exerciseStats[0]
  );

  if (worstExercise && worstExercise.avgScore < 70 && worstExercise !== bestExercise) {
    insights.push({
      type: 'improvement',
      title: `Focus on ${worstExercise.name}`,
      description: `Your ${worstExercise.name.toLowerCase()} form is at ${Math.round(worstExercise.avgScore)}%. Concentrate on slower, controlled reps to improve.`,
      icon: 'target',
      color: '#fbbf24',
    });
  }

  // Streak insight
  const streak = calculateStreak(workouts);
  if (streak >= 2) {
    insights.push({
      type: 'streak',
      title: `${streak}-Session Streak`,
      description: `You've completed ${streak} workouts recently. Stay consistent to build momentum!`,
      icon: 'flame',
      color: '#f87171',
    });
  }

  // Balance insight
  const practicedIds = new Set(exerciseStats.map((e) => e.id));
  const neglected = EXERCISES.filter((e) => !practicedIds.has(e.id));
  if (neglected.length > 0) {
    insights.push({
      type: 'balance',
      title: 'Diversify Your Routine',
      description: `You haven't tried ${neglected.map((e) => e.name).join(' or ')} yet. Mix it up for balanced strength.`,
      icon: 'balance',
      color: '#a78bfa',
    });
  }

  // Recommendation
  const recommendation = generateRecommendation(exerciseStats, workouts);

  // Weekly volume
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyWorkouts = workouts.filter(
    (w) => new Date(w.created_at).getTime() > weekAgo
  );
  const weeklyVolume = weeklyWorkouts.reduce((s, w) => s + w.total_reps, 0);

  // Predicted weekly reps (simple linear projection)
  const dailyAvg = weeklyVolume / 7;
  const predictedWeeklyReps = Math.round(dailyAvg * 7);

  return {
    insights: insights.slice(0, 4),
    recommendation,
    progressTrend,
    weeklyVolume,
    predictedWeeklyReps,
  };
}

interface ExerciseStat {
  id: ExerciseId;
  name: string;
  totalReps: number;
  avgScore: number;
  sessions: number;
  lastPerformed: string;
}

function getExerciseStats(workouts: WorkoutSession[]): ExerciseStat[] {
  const map = new Map<string, { reps: number; scores: number[]; sessions: number; lastDate: string }>();

  for (const w of workouts) {
    const existing = map.get(w.exercise) ?? { reps: 0, scores: [], sessions: 0, lastDate: w.created_at };
    existing.reps += w.total_reps;
    existing.scores.push(w.avg_form_score);
    existing.sessions += 1;
    if (w.created_at > existing.lastDate) existing.lastDate = w.created_at;
    map.set(w.exercise, existing);
  }

  const stats: ExerciseStat[] = [];
  for (const [id, data] of map) {
    const ex = EXERCISES.find((e) => e.id === id);
    stats.push({
      id: id as ExerciseId,
      name: ex?.name ?? id,
      totalReps: data.reps,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      sessions: data.sessions,
      lastPerformed: data.lastDate,
    });
  }

  return stats.sort((a, b) => b.avgScore - a.avgScore);
}

function calculateStreak(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].created_at).getTime();
    const curr = new Date(sorted[i].created_at).getTime();
    const daysDiff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 3) streak++;
    else break;
  }

  return streak;
}

function generateRecommendation(
  stats: ExerciseStat[],
  workouts: WorkoutSession[]
): AIRecommendation | null {
  if (stats.length === 0) return null;

  // Find the exercise with the lowest form score that has been practiced
  const practiced = stats.filter((s) => s.sessions > 0);
  if (practiced.length === 0) return null;

  // Prioritize: lowest score exercise, or a neglected exercise
  const neglected = EXERCISES.filter(
    (e) => !practiced.some((p) => p.id === e.id)
  );

  let targetExercise: ExerciseConfig | null = null;
  let reason = '';
  let focusArea = '';
  let confidence = 0.7;

  if (neglected.length > 0) {
    targetExercise = neglected[0];
    reason = `You haven't tried ${targetExercise.name} yet. It's time to diversify your training!`;
    focusArea = 'New movement pattern';
    confidence = 0.85;
  } else {
    // Recommend the exercise with the lowest score
    const lowest = practiced.reduce(
      (min, curr) => (curr.avgScore < min.avgScore ? curr : min),
      practiced[0]
    );
    targetExercise = EXERCISES.find((e) => e.id === lowest.id) ?? null;
    reason = `Your ${lowest.name.toLowerCase()} form accuracy is ${Math.round(lowest.avgScore)}%. Focus on controlled reps to improve.`;
    focusArea = 'Form refinement';
    confidence = Math.min(0.95, 0.6 + lowest.sessions * 0.05);
  }

  if (!targetExercise) return null;

  // Target reps based on user's average
  const avgReps =
    workouts.length > 0
      ? Math.round(workouts.reduce((s, w) => s + w.total_reps, 0) / workouts.length)
      : 10;
  const targetReps = Math.max(8, Math.min(25, avgReps + 3));

  return {
    exerciseId: targetExercise.id,
    exerciseName: targetExercise.name,
    reason,
    targetReps,
    focusArea,
    confidence,
    accentColor: targetExercise.accentColor,
  };
}
