# Mr. Slicey Butcher Shop

Tiny horror-themed 2D pixel-style web game built with Phaser.

## Current Build (Vertical Slice)
- 3 escalating deliveries
- Core loop: **Deliver → get hunted → solve switches/key puzzle → escape**
- Chase-survival gameplay with increasing tension each round
- Title + in-game horror audio and jumpscare scene

## Stack
- Phaser 3
- Vite
- JavaScript (ES modules)

## Run Locally
```bash
npm install
npm run dev
```
Then open the local Vite URL (usually `http://localhost:5173`).

## Build for Production
```bash
npm run build
npm run preview
```
Production files are generated in `dist/`.

## Controls
- Move: `WASD` or Arrow keys
- Sprint: `Shift`
- Interact with nearby objects: `E`
- Freeze shot: `Left Click`
- Activate switches: `Click` switch directly
- Start game: `Space`
- Replay from ending: `R`

## Website Deployment
This game is already a website project. You can publish it in minutes.

### Option A: Vercel (easiest)
1. Push this repo to GitHub.
2. Go to [https://vercel.com](https://vercel.com) and import the repo.
3. Deploy (settings are auto-detected from `vercel.json`).
4. You’ll get a live URL like `https://mr-slicey-butcher-shop.vercel.app`.

### Option B: Netlify
1. Push this repo to GitHub.
2. Go to [https://app.netlify.com](https://app.netlify.com) and add new site from Git.
3. Build settings are already in `netlify.toml`.
4. Deploy and share your Netlify URL.

## Project Structure
```text
src/
  game/
    characterArt.js
    constants.js
    faceArt.js
    state.js
    ui.js
  scenes/
    BootScene.js
    TitleScene.js
    DeliveryScene.js
    JumpscareScene.js
    EndScene.js
  main.js
```

## Next Suggested Improvements
- Tilemap + real pixel assets (character sprites, props, lighting)
- Patrol + line-of-sight attacker AI (instead of direct homing)
- Puzzle variety (code lock, crate push room, breaker rerouting)
- Settings menu (audio sliders, text distortion toggle)
- Save/checkpoint system and expanded story beats
