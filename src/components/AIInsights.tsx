import type { WorkoutSession, ExerciseId } from '../types';
import { analyzeWorkouts } from '../lib/recommendationEngine';

interface AIInsightsProps {
  workouts: WorkoutSession[];
  onSelectExercise: (id: ExerciseId) => void;
}

export function AIInsights({ workouts, onSelectExercise }: AIInsightsProps) {
  const analysis = analyzeWorkouts(workouts);

  const trendLabels: Record<string, { text: string; color: string }> = {
    improving: { text: 'Improving', color: '#34d399' },
    stable: { text: 'Stable', color: '#22d3ee' },
    declining: { text: 'Needs Focus', color: '#fbbf24' },
    new: { text: 'Getting Started', color: '#a78bfa' },
  };

  const trend = trendLabels[analysis.progressTrend];

  return (
    <section className="ai-section">
      <div className="section-header">
        <div className="ai-section-title">
          <div className="ai-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3c0 1.6-1.4 3-3 3a3 3 0 0 0 0 6c1.6 0 3 1.4 3 3a3 3 0 0 0 6 0c0-1.6 1.4-3 3-3a3 3 0 0 0 0-6c-1.6 0-3-1.4-3-3a3 3 0 0 0-3-3z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h2 className="section-title">AI Insights</h2>
            <span className="ai-section-subtitle">Neural network analysis of your training patterns</span>
          </div>
        </div>
        <div className="ai-trend-badge" style={{ '--trend-color': trend.color } as React.CSSProperties}>
          <span className="ai-trend-dot" />
          {trend.text}
        </div>
      </div>

      {analysis.recommendation && (
        <div className="ai-recommendation" style={{ '--rec-color': analysis.recommendation.accentColor } as React.CSSProperties}>
          <div className="ai-recommendation-header">
            <div className="ai-recommendation-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.66 4A2 2 0 0 1 11.74 2h.52A2 2 0 0 1 14.34 4l.32 1.34a4 4 0 0 1 1.95 1.13l1.31-.26a2 2 0 0 1 2.19 1l.26.45a2 2 0 0 1-.41 2.42l-.95.93a4 4 0 0 1 0 2.26l.95.93a2 2 0 0 1 .41 2.42l-.26.45a2 2 0 0 1-2.19 1l-1.31-.26a4 4 0 0 1-1.95 1.13L14.34 20a2 2 0 0 1-2.08 2h-.52a2 2 0 0 1-2.08-2l-.32-1.35a4 4 0 0 1-1.95-1.12l-1.31.26a2 2 0 0 1-2.19-1l-.26-.45a2 2 0 0 1 .41-2.42l.95-.93a4 4 0 0 1 0-2.26l-.95-.93a2 2 0 0 1-.41-2.42l.26-.45a2 2 0 0 1 2.19-1l1.31.26a4 4 0 0 1 1.95-1.13z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Recommended Next</span>
            </div>
            <span className="ai-confidence">
              {Math.round(analysis.recommendation.confidence * 100)}% confidence
            </span>
          </div>
          <h3 className="ai-recommendation-title">{analysis.recommendation.exerciseName}</h3>
          <p className="ai-recommendation-reason">{analysis.recommendation.reason}</p>
          <div className="ai-recommendation-meta">
            <div className="ai-meta-item">
              <span className="ai-meta-value">{analysis.recommendation.targetReps}</span>
              <span className="ai-meta-label">Target Reps</span>
            </div>
            <div className="ai-meta-divider" />
            <div className="ai-meta-item">
              <span className="ai-meta-value">{analysis.recommendation.focusArea}</span>
              <span className="ai-meta-label">Focus</span>
            </div>
          </div>
          <button
            className="ai-recommendation-btn"
            onClick={() => onSelectExercise(analysis.recommendation!.exerciseId)}
          >
            Start {analysis.recommendation.exerciseName}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="ai-insights-grid">
        {analysis.insights.map((insight, i) => (
          <div key={i} className="ai-insight-card" style={{ '--insight-color': insight.color } as React.CSSProperties}>
            <div className="ai-insight-icon">
              <InsightIcon icon={insight.icon} />
            </div>
            <div className="ai-insight-content">
              <h4 className="ai-insight-title">{insight.title}</h4>
              <p className="ai-insight-desc">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ai-projection">
        <div className="ai-projection-item">
          <span className="ai-projection-value">{analysis.weeklyVolume}</span>
          <span className="ai-projection-label">Reps This Week</span>
        </div>
        <div className="ai-projection-divider" />
        <div className="ai-projection-item">
          <span className="ai-projection-value">{analysis.predictedWeeklyReps}</span>
          <span className="ai-projection-label">Projected Next Week</span>
        </div>
        <div className="ai-projection-divider" />
        <div className="ai-projection-item">
          <span className="ai-projection-value">{workouts.length}</span>
          <span className="ai-projection-label">Total Sessions</span>
        </div>
      </div>
    </section>
  );
}

function InsightIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    trophy: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    flame: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    balance: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M5 7l-3 6a3 3 0 0 0 6 0z" />
        <path d="M19 7l-3 6a3 3 0 0 0 6 0z" />
        <path d="M8 21h8" />
      </svg>
    ),
    spark: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? icons.spark}</>;
}
