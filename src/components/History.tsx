import { useEffect, useState } from 'react';
import type { WorkoutSession } from '../types';
import { fetchWorkouts, deleteWorkout } from '../lib/supabase';
import { EXERCISES } from '../lib/exercises';

export function History() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchWorkouts()
      .then((data) => {
        setWorkouts(data as WorkoutSession[]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load workout history');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError('Failed to delete workout');
    }
  };

  const totalReps = workouts.reduce((s, w) => s + w.total_reps, 0);
  const totalCorrect = workouts.reduce((s, w) => s + w.correct_reps, 0);
  const totalDuration = workouts.reduce((s, w) => s + w.duration_seconds, 0);
  const accuracy = totalReps > 0 ? Math.round((totalCorrect / totalReps) * 100) : 0;

  return (
    <div className="history">
      <header className="page-header">
        <div>
          <h1 className="page-title">Workout History</h1>
          <p className="page-subtitle">Track your progress and performance over time</p>
        </div>
      </header>

      <div className="history-summary">
        <div className="summary-card">
          <span className="summary-value">{workouts.length}</span>
          <span className="summary-label">Sessions</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{totalReps}</span>
          <span className="summary-label">Total Reps</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{accuracy}%</span>
          <span className="summary-label">Accuracy</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{Math.floor(totalDuration / 60)}m</span>
          <span className="summary-label">Total Time</span>
        </div>
      </div>

      {loading ? (
        <div className="history-empty">Loading...</div>
      ) : error ? (
        <div className="history-empty">
          <p>{error}</p>
          <button className="btn-retry" onClick={load}>Try Again</button>
        </div>
      ) : workouts.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              <path d="M12 7v5l4 2" />
            </svg>
          </div>
          <h3>No workouts yet</h3>
          <p>Complete your first exercise session to see your progress here</p>
        </div>
      ) : (
        <div className="history-table">
          {workouts.map((w) => {
            const ex = EXERCISES.find((e) => e.id === w.exercise);
            return (
              <div key={w.id} className="history-row">
                <div className="history-row-icon" style={{ background: ex?.accentColor ?? '#22d3ee' }}>
                  <span>{ex?.name.charAt(0) ?? 'W'}</span>
                </div>
                <div className="history-row-info">
                  <span className="history-row-name">{w.exercise.replace(/_/g, ' ')}</span>
                  <span className="history-row-date">
                    {new Date(w.created_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="history-row-stats">
                  <div className="history-stat">
                    <span className="history-stat-value">{w.total_reps}</span>
                    <span className="history-stat-label">Reps</span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-value good">{w.correct_reps}</span>
                    <span className="history-stat-label">Good</span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-value bad">{w.incorrect_reps}</span>
                    <span className="history-stat-label">Bad</span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-value">{Math.floor(w.duration_seconds / 60)}m {w.duration_seconds % 60}s</span>
                    <span className="history-stat-label">Time</span>
                  </div>
                  <div className="history-stat">
                    <span className={`history-stat-value ${w.avg_form_score >= 70 ? 'good' : 'poor'}`}>
                      {w.avg_form_score}%
                    </span>
                    <span className="history-stat-label">Form</span>
                  </div>
                </div>
                <button className="history-row-delete" onClick={() => handleDelete(w.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
