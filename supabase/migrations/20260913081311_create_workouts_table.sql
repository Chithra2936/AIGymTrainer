/*
# Create workouts table for workout history

1. New Tables
- `workouts`
  - `id` (uuid, primary key)
  - `exercise` (text, not null) — the exercise type performed (squat, bicep_curl, pushup, lunge, shoulder_press)
  - `total_reps` (integer, not null, default 0) — total repetitions counted
  - `correct_reps` (integer, not null, default 0) — repetitions performed with good form
  - `incorrect_reps` (integer, not null, default 0) — repetitions with poor form
  - `duration_seconds` (integer, not null, default 0) — workout duration in seconds
  - `avg_form_score` (real, default 0) — average form quality score (0-100)
  - `created_at` (timestamptz, default now()) — when the workout was recorded

2. Security
- Enable RLS on `workouts`.
- This is a single-tenant app with no sign-in screen, so anon + authenticated CRUD is allowed.
- All data is intentionally shared/public within this app instance.
*/

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise text NOT NULL,
  total_reps integer NOT NULL DEFAULT 0,
  correct_reps integer NOT NULL DEFAULT 0,
  incorrect_reps integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  avg_form_score real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
CREATE POLICY "anon_select_workouts" ON workouts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
CREATE POLICY "anon_insert_workouts" ON workouts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
CREATE POLICY "anon_update_workouts" ON workouts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workouts" ON workouts;
CREATE POLICY "anon_delete_workouts" ON workouts FOR DELETE
  TO anon, authenticated USING (true);
