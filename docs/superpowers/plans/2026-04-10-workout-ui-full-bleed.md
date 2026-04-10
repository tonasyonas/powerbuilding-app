# Workout UI Full-Bleed Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the card wrapper from exercise sections and use sticky headers + vertical spacing to separate exercises, reclaiming horizontal space for set row inputs.

**Architecture:** Single-file UI refactor of workout-client.tsx. Remove card wrapper classes from `<section>`, make exercise headers sticky with z-30, replace card padding with container-aligned padding, and use vertical margin for exercise separation.

**Tech Stack:** React, Tailwind CSS

---

### Task 1: Remove card wrapper and add exercise spacing

**Files:**
- Modify: `src/app/workout/[id]/workout-client.tsx:530-539`

- [ ] **Step 1: Change the `<main>` spacing class**

The `<main>` currently uses `space-y-5` which adds 20px between cards. Replace with `space-y-10` for more breathing room between exercises now that cards are gone.

```tsx
<main className="max-w-lg mx-auto px-5 pt-6 space-y-10">
```

- [ ] **Step 2: Remove card classes from the `<section>` element**

Replace the card wrapper:

```tsx
// Before (line 538-539):
className="rounded-xl border border-border bg-card overflow-hidden"

// After:
className=""
```

- [ ] **Step 3: Run the dev server and visually verify**

Run: `npm run dev`

Open a workout page. Verify:
- No card borders/backgrounds around exercises
- Exercises have clear vertical separation
- Set rows span the full container width

- [ ] **Step 4: Commit**

```bash
git add src/app/workout/[id]/workout-client.tsx
git commit -m "refactor: remove card wrapper from workout exercise sections"
```

---

### Task 2: Make exercise headers sticky

**Files:**
- Modify: `src/app/workout/[id]/workout-client.tsx:542`

- [ ] **Step 1: Add sticky positioning and background to the exercise header div**

The page header is `sticky top-0 z-40` with `py-4` and content inside. It measures roughly 68px. The exercise header should stick just below it.

Replace the exercise header div classes:

```tsx
// Before (line 542):
<div className="px-4 pt-4 pb-3">

// After:
<div className="sticky top-[68px] z-30 bg-zinc-950 px-5 pt-4 pb-3 border-b border-border">
```

Key changes:
- `sticky top-[68px]` — sticks below the page header
- `z-30` — below page header (z-40), above set rows
- `bg-zinc-950` — opaque background so content doesn't show through
- `px-5` — matches container padding (was `px-4` inside the card)
- `border-b border-border` — subtle separator from set rows

- [ ] **Step 2: Run dev server and test sticky behavior**

Run: `npm run dev`

Open a workout with multiple exercises (one with warmup sets). Scroll through the sets and verify:
- The exercise header sticks below the page header
- Headers don't overlap the page header
- Background is opaque (no content bleeding through)
- When scrolling to the next exercise, its header replaces the previous one

If the `top-[68px]` value is off (header overlaps or has a gap), inspect the page header's actual height in dev tools and adjust the value.

- [ ] **Step 3: Commit**

```bash
git add src/app/workout/[id]/workout-client.tsx
git commit -m "feat: make exercise headers sticky below page header"
```

---

### Task 3: Adjust set row padding to match container

**Files:**
- Modify: `src/app/workout/[id]/workout-client.tsx:605`

- [ ] **Step 1: Update the set rows wrapper padding**

The set rows wrapper currently uses `px-4 pb-4` which was relative to the card's internal padding. Now it should use `px-5` to align with the container and sticky header.

```tsx
// Before (line 605):
<div className="px-4 pb-4">

// After:
<div className="px-5 pb-4">
```

- [ ] **Step 2: Visually verify alignment**

Run: `npm run dev`

Verify:
- Set rows align horizontally with the exercise header text
- WARMUP / WORKING labels align with the header
- Inputs have more horizontal space than before

- [ ] **Step 3: Commit**

```bash
git add src/app/workout/[id]/workout-client.tsx
git commit -m "fix: align set row padding with container after card removal"
```
