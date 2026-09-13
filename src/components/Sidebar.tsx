import type { ExerciseConfig, ExerciseId } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'workout' | 'history';
  onNavigate: (view: 'dashboard' | 'history') => void;
  exercises: ExerciseConfig[];
  onSelectExercise: (id: ExerciseId) => void;
  selectedExercise: ExerciseId;
}

export function Sidebar({
  currentView,
  onNavigate,
  exercises,
  onSelectExercise,
  selectedExercise,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.4 14.4L9.6 9.6" />
            <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.829 2.829z" />
            <path d="M21.485 5.343a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364 6.364a2 2 0 1 1 2.829 2.829z" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">AI GYM</span>
          <span className="sidebar-logo-subtitle">TRAINER</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => onNavigate('history')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <path d="M12 7v5l4 2" />
          </svg>
          History
        </button>
      </nav>

      <div className="sidebar-exercises">
        <span className="sidebar-section-label">Exercises</span>
        {exercises.map((ex) => (
          <button
            key={ex.id}
            className={`sidebar-exercise-item ${
              currentView === 'workout' && selectedExercise === ex.id ? 'active' : ''
            }`}
            onClick={() => onSelectExercise(ex.id)}
            style={{ '--exercise-color': ex.accentColor } as React.CSSProperties}
          >
            <span className="sidebar-exercise-dot" />
            {ex.name}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 0-10 10h10V2z" />
            </svg>
          </div>
          <div>
            <p className="sidebar-footer-title">AI-Powered</p>
            <p className="sidebar-footer-subtitle">Real-time form analysis</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
