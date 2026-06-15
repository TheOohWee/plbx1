# PayPal "Playoff" Runner — Playable Ad

A from-scratch clone of the Playbox runner playable
(reference: `playbox.play.plbx.ai/playoff/runner`), built in
**Cocos Creator 3.8.8** (TypeScript).

**Live demo:** _(GitHub Pages link added on deploy)_

## Gameplay
Tap **Start** → the character auto-runs through a park. She stops at the first
enemy for a one-time **"Jump to avoid enemies"** tutorial; tap to jump it. From
there, **tap to jump** over traffic cones and oncoming runners and grab floating
cash to grow your PayPal balance. Lose all 3 hearts → Lose screen; cross the
finish tape → Win screen.

- 3 hearts, green hit-flash + brief FAIL flash before the lose screen
- Collectible cash flies to the PayPal score badge
- **Finish tape with a rope effect** (verlet rope sim that snaps when crossed)
- Win / Lose reward screens (PayPal card, countdown, INSTALL & EARN → store link)
- Tutorial prompts and "Perfect!/Nice!" dodge popups
- Parallax scrolling background + scenery, music & synthesized SFX

## Responsive (portrait + landscape)
The biggest engineering focus. Instead of letterboxing or zooming, the world is
**bottom-anchored** to the live viewport so the ground always sits near the
bottom and the extra space becomes sky/scenery — composed correctly in both
orientations.

- `ResponsiveFit` — switches resolution policy by orientation (FIXED_HEIGHT
  landscape / FIXED_WIDTH portrait) so the screen always fills.
- `WorldFit` — shifts the world layers + player so the ground line lands at a
  fixed fraction up from the screen bottom, recomputed live on resize/rotate.
- `Anchor` — pins UI to a screen **or parent** edge (used to group the bottom
  bar so the footer + Install button stay aligned and responsive).
- `ColorFill` / `SkyGround` — Graphics-drawn fills (no assets) that stretch to
  any width to back the bottom bar and the sky.

## Approach
- **Decoupled components**: `Player`, `Enemy`, `ScrollLayer` (infinite parallax),
  `GameManager` (state, finite track scroll, collisions, score, jump-tutorial
  gate), `Hud`, `Win/LoseScreen`, `FinishTape`, plus helpers (`Bob`, `Spin`,
  `Pulse`, `DimOverlay`, `GoldButton`, `OpenUrl`, `Audio`).
- **Finite hand-placed track**: cones/enemies/cash/finish live on one `Track`
  container that scrolls once — no per-frame spawning, so no freezes.
- A shared `GameState.paused` flag freezes the whole world together (start gate,
  jump tutorial, win/lose).
- **Synthesized hit SFX** via WebAudio — a short "thud" instead of a long clip,
  keeping the bundle small and the feedback snappy.

## Run / Build / Deploy
1. Open the `Playbox1` project in Cocos Creator 3.8.8; press **▶ Preview** to play.
2. **Project → Build** → Web Mobile.
3. `node tools/inline.js` packs the build into a single inlined `dist/index.html`
   (all JS/CSS/assets embedded, ≤ 5 MB).
4. Deployed to **GitHub Pages** from `dist/`.

## Controls
- **Tap / click** — start, then jump.
