import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  real,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ============================================
// SHARED TABLES (program template)
// ============================================

export const exercise = pgTable("exercise", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bodyPart: text("body_part").notNull(),
  muscleGroups: jsonb("muscle_groups").notNull().default([]),
  category: text("category").notNull(),
  defaultReferenceLift: text("default_reference_lift"),
  substitutionGroup: text("substitution_group"),
});

export const week = pgTable("week", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull(),
  splitType: text("split_type").notNull(),
  variant: text("variant"),
  label: text("label").notNull(),
  notes: text("notes"),
});

export const workout = pgTable(
  "workout",
  {
    id: serial("id").primaryKey(),
    weekId: integer("week_id")
      .notNull()
      .references(() => week.id),
    dayNumber: integer("day_number").notNull(),
    name: text("name").notNull(),
    splitLabel: text("split_label").notNull(),
    isOptional: boolean("is_optional").notNull().default(false),
  },
  (table) => [index("idx_workout_week").on(table.weekId)]
);

export const workoutExercise = pgTable(
  "workout_exercise",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workout.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercise.id),
    order: integer("order").notNull(),

    // Sets
    warmupSets: integer("warmup_sets").notNull().default(0),
    workingSets: integer("working_sets").notNull(),
    setType: text("set_type").notNull().default("working"),

    // Reps
    repsMin: integer("reps_min"),
    repsMax: integer("reps_max"),
    isAmrap: boolean("is_amrap").notNull().default(false),

    // Intensity
    percent1rmMin: real("percent_1rm_min"),
    percent1rmMax: real("percent_1rm_max"),
    referenceLift: text("reference_lift"),
    rpe: real("rpe"),

    // Rest
    restMinSeconds: integer("rest_min_seconds"),
    restMaxSeconds: integer("rest_max_seconds"),

    // Grouping
    supersetGroup: text("superset_group"),
    supersetOrder: integer("superset_order"),

    // Meta
    notes: text("notes"),
    isOptional: boolean("is_optional").notNull().default(false),
  },
  (table) => [index("idx_we_workout").on(table.workoutId)]
);

// ============================================
// PER-USER TABLES
// ============================================

export const userProfile = pgTable("user_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  displayName: text("display_name"),
  squat1rm: real("squat_1rm"),
  bench1rm: real("bench_1rm"),
  deadlift1rm: real("deadlift_1rm"),
  ohp1rm: real("ohp_1rm"),
  custom1rms: jsonb("custom_1rms").default({}),
  unit: text("unit").notNull().default("kg"),
  plateIncrement: real("plate_increment").notNull().default(2.5),
  week10Variant: text("week_10_variant").notNull().default("A"),
  deloadFirst: boolean("deload_first").notNull().default(false),
  currentWeekId: integer("current_week_id").references(() => week.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workoutLog = pgTable(
  "workout_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workout.id),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    bodyWeight: real("body_weight"),
    notes: text("notes"),
  },
  (table) => [
    index("idx_wl_user").on(table.userId),
    index("idx_wl_workout").on(table.workoutId),
  ]
);

export const setLog = pgTable(
  "set_log",
  {
    id: serial("id").primaryKey(),
    workoutLogId: integer("workout_log_id")
      .notNull()
      .references(() => workoutLog.id, { onDelete: "cascade" }),
    workoutExerciseId: integer("workout_exercise_id")
      .notNull()
      .references(() => workoutExercise.id),
    setNumber: integer("set_number").notNull(),
    setType: text("set_type").notNull(),
    targetWeight: real("target_weight"),
    actualWeight: real("actual_weight"),
    actualReps: integer("actual_reps"),
    rpeActual: real("rpe_actual"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("idx_sl_workout_log").on(table.workoutLogId)]
);
