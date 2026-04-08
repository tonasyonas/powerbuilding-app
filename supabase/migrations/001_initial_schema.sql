-- ============================================
-- Powerbuilding Tracker: Initial Schema
-- ============================================

-- ============================================
-- SHARED TABLES (program template, read-only)
-- ============================================

CREATE TABLE exercise (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  body_part             TEXT NOT NULL,
  muscle_groups         JSONB NOT NULL DEFAULT '[]',
  category              TEXT NOT NULL,
  default_reference_lift TEXT,
  substitution_group    TEXT
);

CREATE TABLE week (
  id          SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL,
  split_type  TEXT NOT NULL,
  variant     TEXT,
  label       TEXT NOT NULL,
  notes       TEXT
);

CREATE TABLE workout (
  id          SERIAL PRIMARY KEY,
  week_id     INTEGER NOT NULL REFERENCES week(id),
  day_number  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  split_label TEXT NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE workout_exercise (
  id                SERIAL PRIMARY KEY,
  workout_id        INTEGER NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL REFERENCES exercise(id),
  "order"           INTEGER NOT NULL,

  warmup_sets       INTEGER NOT NULL DEFAULT 0,
  working_sets      INTEGER NOT NULL,
  set_type          TEXT NOT NULL DEFAULT 'working',

  reps_min          INTEGER,
  reps_max          INTEGER,
  is_amrap          BOOLEAN NOT NULL DEFAULT false,

  percent_1rm_min   REAL,
  percent_1rm_max   REAL,
  reference_lift    TEXT,
  rpe               REAL,

  rest_min_seconds  INTEGER,
  rest_max_seconds  INTEGER,

  superset_group    TEXT,
  superset_order    INTEGER,

  notes             TEXT,
  is_optional       BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for common queries
CREATE INDEX idx_workout_week ON workout(week_id);
CREATE INDEX idx_workout_exercise_workout ON workout_exercise(workout_id);

-- ============================================
-- PER-USER TABLES (RLS-protected)
-- ============================================

CREATE TABLE user_profile (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  squat_1rm         REAL,
  bench_1rm         REAL,
  deadlift_1rm      REAL,
  ohp_1rm           REAL,
  custom_1rms       JSONB DEFAULT '{}',
  unit              TEXT NOT NULL DEFAULT 'kg',
  plate_increment   REAL NOT NULL DEFAULT 2.5,
  week_10_variant   TEXT NOT NULL DEFAULT 'A',
  deload_first      BOOLEAN NOT NULL DEFAULT false,
  current_week_id   INTEGER REFERENCES week(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE workout_log (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id    INTEGER NOT NULL REFERENCES workout(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  body_weight   REAL,
  notes         TEXT
);

CREATE TABLE set_log (
  id                    SERIAL PRIMARY KEY,
  workout_log_id        INTEGER NOT NULL REFERENCES workout_log(id) ON DELETE CASCADE,
  workout_exercise_id   INTEGER NOT NULL REFERENCES workout_exercise(id),
  set_number            INTEGER NOT NULL,
  set_type              TEXT NOT NULL,
  target_weight         REAL,
  actual_weight         REAL,
  actual_reps           INTEGER,
  rpe_actual            REAL,
  completed_at          TIMESTAMPTZ
);

CREATE INDEX idx_workout_log_user ON workout_log(user_id);
CREATE INDEX idx_workout_log_workout ON workout_log(workout_id);
CREATE INDEX idx_set_log_workout_log ON set_log(workout_log_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Shared tables: readable by everyone (authenticated)
ALTER TABLE exercise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are readable by authenticated users"
  ON exercise FOR SELECT TO authenticated USING (true);

ALTER TABLE week ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weeks are readable by authenticated users"
  ON week FOR SELECT TO authenticated USING (true);

ALTER TABLE workout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workouts are readable by authenticated users"
  ON workout FOR SELECT TO authenticated USING (true);

ALTER TABLE workout_exercise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout exercises are readable by authenticated users"
  ON workout_exercise FOR SELECT TO authenticated USING (true);

-- Per-user tables: users can only access their own data
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile"
  ON user_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE workout_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workout logs"
  ON workout_log FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE set_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own set logs"
  ON set_log FOR ALL TO authenticated
  USING (
    workout_log_id IN (SELECT id FROM workout_log WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workout_log_id IN (SELECT id FROM workout_log WHERE user_id = auth.uid())
  );

-- ============================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profile (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
