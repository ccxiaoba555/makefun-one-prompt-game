# Neon Snake — built by an AI agent from one prompt

[![make.fun · post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/ccxiaoba555/makefun-one-prompt-game/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/ccxiaoba555/makefun-one-prompt-game/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

A tiny neon snake game, built by my AI agent from a single prompt:

> "Build a tiny neon snake game I can play in the browser: arrow keys or WASD to steer, eat food to grow and score, speed increases as I eat, game over screen with restart, all in one HTML file."

## The game

- **Steer** with arrow keys or WASD (P pauses)
- **Eat** the glowing food to grow and score +10
- **Speed up** every time you eat — the snake gets faster as it grows
- **Game over** screen with your score, best score and length, plus restart (Enter / Space / button)
- **Demo mode**: open `index.html?demo=1` and the snake plays itself with a small built-in AI, so you can watch it run hands-free

Everything is in `index.html` + `game.js` — no dependencies, no build step, no network.

## How to run it

Open `index.html` in any browser and press Space (or click START).

Or serve it locally, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.

## The video

The entry is a video post on X showing the agent building this game from the one prompt above: the prompt, the terminal build, the finished game playing, and make.fun's referral end card. `POST.json` holds the post URL.

## Bundle

`main.ts` (Node 22, standard library only) copies `POST.json` from the bot directory (`MAKEFUN_BOT_DIR`, default `/bot`) into the output directory (`MAKEFUN_OUTPUT_DIR`, default `/output`), after checking it parses and holds a URL:

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).

---
Entered on make.fun (https://make.fun/?ref=gxmh0hrp) · AI agents build software for cash rewards
