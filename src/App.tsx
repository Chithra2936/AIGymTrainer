import { useState } from 'react';
import type { ExerciseId } from './types';
import { EXERCISES } from './lib/exercises';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { History } from './components/History';

type View = 'dashboard' | 'workout' | 'history';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId>('squat');

  const handleSelectExercise = (id: ExerciseId) => {
    setSelectedExercise(id);
    setView('workout');
  };

  const handleFinishWorkout = () => {
    setView('history');
  };

  return (
    <div className="app">
      <Sidebar
        currentView={view}
        onNavigate={setView}
        exercises={EXERCISES}
        onSelectExercise={handleSelectExercise}
        selectedExercise={selectedExercise}
      />
      <main className="app-main">
        {view === 'dashboard' && (
          <Dashboard
            exercises={EXERCISES}
            onSelectExercise={handleSelectExercise}
            onGoToHistory={() => setView('history')}
          />
        )}
        {view === 'workout' && (
          <WorkoutSession
            exerciseId={selectedExercise}
            onExit={() => setView('dashboard')}
            onFinish={handleFinishWorkout}
          />
        )}
        {view === 'history' && <History />}
      </main>
    </div>
  );
}
