---
name: game-trailer
description: Make a movie-style trailer video (MP4 with music and title cards) of the Wizard Meadow game by recording scripted camera shots of the real game in a headless browser. Use when the user asks for a trailer, promo video, teaser, showcase video or "a video of my game".
---

# Wizard Meadow trailer

Films cinematic shots straight from `wizard-meadow/index.html` and adds:
- letterbox bars
- title cards
- a synthesised trailer score

It then edits everything into one MP4. The game file on disk is never changed: the recorder patches an in-memory copy only.

## Run it

From the repository root:

```bash
bash .claude/skills/game-trailer/scripts/make_trailer.sh [out.mp4] [fps] [width] [height]
```

- **Defaults:** `wizard-meadow/trailer/WizardMeadow-trailer.mp4`, 20 fps, 960x540.
- **`TRAILER_JOBS=n`:** records the shots in n browsers side by side (default 2).
- **`TRAILER_ONLY=1,3`:** records only those shots, for quick tests.
- **`TRAILER_WORK=dir`:** keeps the frames in that folder.
- **`TRAILER_GFX=fast|auto|pretty`:** the game's graphics setting (default fast).
- **`THREE_DIR`:** a folder whose `node_modules` holds `three`. Without it, three.js loads from the CDN.

**Speed:** with software rendering (cloud containers), a frame takes about 7 seconds per recorder. A 50-second trailer at 20 fps is about 1,000 frames, roughly 1 hour with 2 recorders. Run it in the background and watch the frame folder. On a machine with a real graphics card it is far faster.

**Before you share it:** look at a few frames (for example `frames/s03_00030.jpg`) to check the shots. Then send the MP4 and list the shots.

## Files

| File | What it does |
|---|---|
| `scripts/shots.js` | The shot list (runs inside the page). Each shot has `dur` in seconds, an optional `title` or `sub` caption, `black` (black background), `logo` (1 = title over the picture, 2 = end card), `setup()`, `cam(u)` returning `{x,z,y,yaw,pitch}` for u from 0 to 1, and an optional `act(u,f)` per frame to spawn monsters or cast spells. Edit this to change the trailer. |
| `scripts/record.js` | Opens the game, starts a new game, and steps the game exactly 1/fps seconds per frame, so the video is smooth however slowly it renders. It captures each frame through the browser screencast. |
| `scripts/music.py` | Writes a score timed to the cuts: drone, chord swells, a rising pulse, a hit on each cut, a final boom and a held chord under the title, soft-limited. |
| `scripts/make_trailer.sh` | Runs the recorders, joins the frames in order, makes the music and encodes with ffmpeg. |

## Hard-won notes

These cost hours to find, so keep them:

- **Hidden panels:** the page wrapper must include `[hidden]{display:none!important}`, the rule the artifact host normally provides. Without it the dark map panel covers the game and every frame is dark.
- **Reading pixels back:** do not use `drawImage`, `readPixels` or `preserveDrawingBuffer` on the WebGL canvas in software rendering. Memory balloons past 10 GB and the browser is killed. The screencast is safe.
- **Frame timing:** do not replace `requestAnimationFrame`. Patch the game's `frame()` so it only moves on when the recorder asks.
- **Black Hole and similar spells:** they pull hundreds of building blocks at once and can stall a recorder. Prefer Fire Tornado, Meteor, Lightning and Blizzard.
- **Hidden while filming:** the fairy, screen flashes, the HUD and the staff are hidden. The game's automatic quality governor is turned off.
