# IQ Games — Brain Challenge

A lightweight product prototype for a premium, visually calm IQ puzzle game.

## Current direction

The prototype is intentionally built with **HTML, CSS, and vanilla JavaScript** so the product, interactions, puzzle feel, and App Store presentation can be iterated rapidly before committing to a native implementation.

Design principles:

- Bright, warm, easy-on-the-eyes visual system
- Premium rather than clinical or childish
- Strong visual hierarchy and large tap targets
- Short daily session: seven varied puzzles
- Gameplay should be attractive enough to become App Store screenshots
- No claims that the game measures clinical IQ or fabricated population percentiles
- Fast, satisfying feedback with restrained animation

## Current prototype

The Daily IQ Run now demonstrates multiple puzzle grammars rather than one repeated template, including tactile-looking visual puzzles:

1. Pattern sequence
2. 3×3 logic matrix
3. Odd-one-out visual observation
4. Timed visual memory recall
5. Spatial rotation
6. Visual arithmetic / deduction
7. Final matrix challenge

The prototype also includes:

- Twenty-second challenge timer
- Correct / incorrect explanations
- Brain Score calculation
- Pattern, Logic, Focus, and Speed breakdown
- Local best-score persistence
- Responsive mobile-first layout
- Native share-sheet support where available

## Run locally

No build tools are required.

Open `index.html` directly, or serve the folder with any lightweight local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Next product milestones

- Turn quick-play cards into real practice modes
- Add procedural level generators rather than fixed demo puzzles
- Add One Move, Fold, Shadow Match, and deeper Spatial mechanics
- Add daily-seeded challenge selection
- Add onboarding and a lightweight progression system
- Refine scoring from playtest data
- Create App Store icon and screenshots from real gameplay
- Add sound and haptics when the product moves to native


## Data integrity

The prototype intentionally avoids simulated social proof or fake percentile rankings. Personal stats shown in the UI are derived from local play history. Population ranking can be added later only if backed by real leaderboard data.
