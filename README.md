# IQ Games — Brain Challenge

A mobile-first HTML/CSS/vanilla-JavaScript prototype for a bright, premium daily brain-puzzle game.

## Product direction

- Warm, light, easy-on-the-eyes visual system
- Premium rather than clinical or childish
- Seven varied puzzles in a roughly 3–5 minute Daily Run
- Direct manipulation where it improves the puzzle
- Personal Brain Score, practice, XP, streaks, and milestones
- No clinical IQ claims, fabricated population percentiles, or fake social proof
- Gameplay designed to be strong enough to appear directly in App Store screenshots

## Current game

The Daily Run follows a **Warm-up → Steady → Stretch → Final** curve and draws from:

- One Move gem towers
- Pattern sequences
- 3×3 matrices
- Odd-one-out observation
- Timed memory recall
- Spatial rotation
- Balance-scale deduction
- Paper Fold
- Shadow Match
- Visual arithmetic
- Path tracing

Direct interaction is implemented for One Move, Path, Balance, and Fold.

## App flow

**Today → Daily Run → 7 puzzles → Results → recommended practice → Share**

Practice includes Mixed, Pattern, Logic, Spatial, Focus, and Strategy sessions.

Profile tracks locally:

- Daily best score
- XP and level
- Runs played
- Overall accuracy
- Daily streak
- Milestones

## Runtime QA

The September 4 runtime repair pass fixed issues that could prevent or corrupt interaction, including:

- One Move collection-selector crash
- Balance collection-selector crash
- Fold collection-selector crash
- Path endpoint rendering crash
- Path dead ends visually entering the goal
- stale gameplay callbacks after leaving a puzzle
- rapid double-tap commits on One Move and Balance
- double-Next puzzle skipping
- final feedback overlay leaking onto Results
- stale streak display after missed days
- stale Results bars/animations on replay
- browser storage failures breaking progress
- misleading placeholder stats and stale-preview caching

Validation performed on the committed source includes:

- JavaScript syntax validation
- 500 seeded Daily Runs
- 600 generated Practice Runs
- all puzzle answer/index invariants
- isolated runtime interaction tests for every puzzle type
- complete seven-puzzle Daily Run through Results
- Practice/Profile/Home navigation
- correct and incorrect direct-interaction paths
- timeout handling
- reward/streak replay behavior
- Share fallback
- delayed-callback cancellation on exit

## Browser preview

The app has no build step. It can be served as static files.

For local use:

```bash
python3 -m http.server 8000
```

Screenshot/capture helpers:

- `?preview=home`
- `?preview=onemove`
- `?preview=fold`
- `?preview=balance`
- `?preview=path`

## App Store direction

- `assets/app-icon.svg` — current light-first icon direction
- `app-store-preview.html` — screenshot concept board
- `APP_STORE.md` — listing and screenshot guidance

## Data integrity

Population comparisons should only be added when backed by real production data. Current progress statistics are derived from local play history; Brain Rank is a game-defined tier, not a psychometric IQ percentile.
