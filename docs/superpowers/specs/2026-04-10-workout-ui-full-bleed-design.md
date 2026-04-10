# Workout UI: Full-Bleed Set Rows with Sticky Headers

**Date:** 2026-04-10
**Status:** Approved
**Scope:** `src/app/workout/[id]/workout-client.tsx`

## Problem

The current workout UI wraps each exercise in a card (`rounded-xl border border-border bg-card`) with internal padding. On mobile, this steals ~32px of horizontal space from the set rows, making weight/reps inputs feel cramped.

## Solution

Remove the card wrapper. Exercise sections go full-bleed within the existing `max-w-lg` container. Use sticky headers and vertical spacing to separate exercises instead.

## Changes

### 1. Remove card wrapper

**Current:** Each exercise is wrapped in a `<section>` with `rounded-xl border border-border bg-card overflow-hidden`.

**New:** Replace with a plain `<section>` with no border, no background, no border-radius, no overflow-hidden. Set rows and headers use the parent container's full width.

### 2. Sticky exercise headers

The exercise header (name, tags, target, notes toggle) becomes `position: sticky`.

- `top`: offset to sit just below the sticky page header. The page header is ~68px tall (py-4 + content), so use `top: 68px` (refine to exact value during implementation).
- `z-index`: 30 (below page header z-40, above content).
- `background`: `bg-zinc-950` to prevent content showing through when scrolling.
- Add a subtle bottom border (`border-b border-border`) to separate the header from the set rows beneath it.
- Padding: `px-5` to match the parent container's horizontal padding (previously the card added its own `px-4` inside the container's `px-5`).

Header content stays the same:
- Line 1: Exercise name (bold, uppercase, left), target weight + reps (mono, right)
- Line 2: Body part tag, set type badge (if any), superset badge (if any)
- Notes toggle and expandable notes below tags

### 3. Set rows go full-bleed

Remove the card's `px-4` wrapper around set rows. Rows use `px-5` to align with the container padding.

Row layout is unchanged: label -> target -> weight input -> reps input -> check button. The reclaimed horizontal space (~32px from card border + card padding) gives the inputs more room.

### 4. Exercise separation

Replace the card as a grouping mechanism with vertical spacing:
- `mt-10` (or equivalent) between exercise sections.
- First exercise gets no top margin.

### 5. WARMUP / WORKING labels

Keep as-is. Small uppercase divider text within each exercise section. Padding adjusted from `px-4` (card-relative) to `px-5` (container-relative).

## What stays the same

- Rest timer bar (fixed bottom, z-50)
- Finish workout button (fixed bottom, z-40)
- Coaching notes toggle and expandable content
- Warmup row dimming (opacity-70, bg-zinc-900/50)
- Working row styling (bg-zinc-900/80)
- Completion green highlight (bg-success/10)
- Set row internal layout and all input behavior
- Page header (sticky, z-40)

## File impact

| File | Change |
|------|--------|
| `src/app/workout/[id]/workout-client.tsx` | Remove card wrapper classes, add sticky header styles, adjust padding, add inter-exercise spacing |

Single file change. No new components, no data model changes, no new dependencies.
