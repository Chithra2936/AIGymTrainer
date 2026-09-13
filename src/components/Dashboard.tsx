import { useEffect, useState } from 'react';
import type { ExerciseConfig, ExerciseId, WorkoutSession } from '../types';
import { fetchWorkouts } from '../lib/supabase';
import { AIInsights } from './AIInsights';

interface DashboardProps {
  exercises: ExerciseConfig[];
  onSelectExercise: (id: ExerciseId) => void;
  onGoToHistory: () => void;
}

export function Dashboard({ exercises, onSelectExercise, onGoToHistory }: DashboardProps) {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts()
      .then((data) => {
        setWorkouts(data as WorkoutSession[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalReps = workouts.reduce((sum, w) => sum + w.total_reps, 0);
  const totalCorrect = workouts.reduce((sum, w) => sum + w.correct_reps, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration_seconds, 0);
  const avgScore =
    workouts.length > 0
      ? Math.round(workouts.reduce((sum, w) => sum + w.avg_form_score, 0) / workouts.length)
      : 0;
  const accuracy = totalReps > 0 ? Math.round((totalCorrect / totalReps) * 100) : 0;

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back</h1>
          <p className="page-subtitle">Choose an exercise to start training with real-time AI form analysis</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalReps}</span>
            <span className="stat-label">Total Reps</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Form Accuracy</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{Math.floor(totalDuration / 60)}m</span>
            <span className="stat-label">Train Time</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgScore}</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      </section>

      {!loading && (
        <AIInsights workouts={workouts} onSelectExercise={onSelectExercise} />
      )}

      <section className="exercise-section">
        <div className="section-header">
          <h2 className="section-title">Choose Your Exercise</h2>
          <span className="section-subtitle">{exercises.length} exercises available</span>
        </div>
        <div className="exercise-grid">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              className="exercise-card"
              onClick={() => onSelectExercise(ex.id)}
              style={{ '--exercise-color': ex.accentColor } as React.CSSProperties}
            >
              <div className="exercise-card-glow" />
              <div className="exercise-card-icon">
                <ExerciseIcon icon={ex.icon} />
              </div>
              <h3 className="exercise-card-name">{ex.name}</h3>
              <p className="exercise-card-desc">{ex.description}</p>
              <div className="exercise-card-action">
                <span>Start Training</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="recent-section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          {!loading && workouts.length > 0 && (
            <button className="text-link" onClick={onGoToHistory}>
              View all →
            </button>
          )}
        </div>
        {loading ? (
          <div className="recent-empty">Loading...</div>
        ) : workouts.length === 0 ? (
          <div className="recent-empty">
            <p>No workouts yet. Start your first session above!</p>
          </div>
        ) : (
          <div className="recent-list">
            {workouts.slice(0, 5).map((w) => {
              const ex = exercises.find((e) => e.id === w.exercise);
              return (
                <div key={w.id} className="recent-item">
                  <div className="recent-item-dot" style={{ background: ex?.accentColor ?? '#22d3ee' }} />
                  <div className="recent-item-info">
                    <span className="recent-item-name">{w.exercise.replace(/_/g, ' ')}</span>
                    <span className="recent-item-date">
                      {new Date(w.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="recent-item-stats">
                    <span className="recent-item-reps">{w.total_reps} reps</span>
                    <span className="recent-item-score">{w.avg_form_score}% form</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ExerciseIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    squat: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" />
        <path d="M9 20l3-6 3 6" />
        <path d="M9 14h6" />
        <path d="M10 8l2 2 2-2" />
      </svg>
    ),
    curl: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6v6" />
        <path d="M12 12a4 4 0 0 0 4-4" />
        <path d="M8 16h8l-2 4h-4z" />
      </svg>
    ),
    pushup: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2" />
        <path d="M6 8v8" />
        <path d="M2 18h20" />
        <path d="M6 16l4-4" />
        <path d="M10 12h10" />
      </svg>
    ),
    lunge: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="4" r="2" />
        <path d="M10 6l-2 8" />
        <path d="M8 14l4-2 6 2" />
        <path d="M8 14l-2 6" />
        <path d="M14 12l2 8" />
      </svg>
    ),
    press: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6v4" />
        <path d="M8 10h8" />
        <path d="M8 10v6" />
        <path d="M16 10v6" />
        <path d="M8 16l-2 4" />
        <path d="M16 16l2 4" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? icons.squat}</>;
}
