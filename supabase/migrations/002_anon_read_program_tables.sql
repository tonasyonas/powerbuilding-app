-- Allow anonymous (unauthenticated) reads on program data tables.
-- These are static seed data shared across all users, needed by
-- cached server queries that run without auth cookies.

CREATE POLICY "Weeks are publicly readable"
  ON week FOR SELECT TO anon USING (true);

CREATE POLICY "Workouts are publicly readable"
  ON workout FOR SELECT TO anon USING (true);

CREATE POLICY "Workout exercises are publicly readable"
  ON workout_exercise FOR SELECT TO anon USING (true);

CREATE POLICY "Exercises are publicly readable"
  ON exercise FOR SELECT TO anon USING (true);
