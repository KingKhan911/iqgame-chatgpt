# IQ Games — Brain Challenge

A lightweight product prototype for a premium, visually calm IQ puzzle game.

## Current direction

The prototype is intentionally built with **HTML, CSS, and vanilla JavaScript** so the product, interactions, puzzle feel, and App Store presentation can be iterated rapidly before committing to a native implementation.

Design principles:

- Bright, warm, easy-on-the-eyes visual system
- Premium rather than clinical or childish
- Strong visual hierarchy and large tap targets
- Short daily session: seven puzzles
- Gameplay should be attractive enough to become App Store screenshots
- No claims that the game measures clinical IQ
- Fast, satisfying feedback with restrained animation

## Prototype

Current vertical slice:

1. Home / Daily IQ Run
2. Seven playable visual pattern questions
3. Countdown timer and answer feedback
4. Brain Score calculation
5. Results / skill breakdown
6. Local best-score persistence
7. Mobile-first responsive presentation

## Run locally

No build tools are required.

Open `index.html` directly, or serve the folder with any lightweight local web server.

For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Near-term product milestones

- Replace placeholder puzzle set with richer puzzle generators
- Add Memory, Observation, Spatial, Logic, and One Move mechanics
- Create a proper practice mode
- Add daily-seeded puzzle runs
- Refine scoring and progression
- Add polished sound/haptics when moved to native
- Design and test App Store icon/screenshots from real gameplay
