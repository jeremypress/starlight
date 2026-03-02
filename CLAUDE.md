# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Tailscale + QR code + Vite with HTTPS)
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
pnpm preview      # Preview production build
```

No test framework is configured.

## Development Setup

The dev server (`scripts/dev.ts`) integrates with Tailscale to expose the game over a secure URL and prints a QR code for easy mobile testing. HTTPS is provided via mkcert certificates stored in `certs/` (git-ignored). The Vite server binds to `0.0.0.0:5173`.

## Architecture

**Starlight** is a mobile gyroscope-controlled game using **React 19** as the app shell and **Phaser 3** as the game engine.

### React + Phaser Integration

- `src/main.tsx` — React root
- `src/App.tsx` — Permission gate: requests iOS `DeviceOrientationEvent` permission, then instantiates a Phaser `Game` object and mounts it to a `div` ref. React manages the lifecycle of the Phaser instance.
- `src/game/GameScene.ts` — The only Phaser scene. Listens to `deviceorientation` events, maps `gamma` (X tilt) and `beta` (Y tilt, inverted) to arcade physics velocity on a ship sprite.

### Key Design Decisions

- Phaser game config uses a fixed 360×640 canvas (mobile portrait), `ScaleModes.FIT`, and arcade physics.
- iOS gyroscope permission must be requested from a user gesture; this is handled in `App.tsx` before Phaser initializes.
- `index.html` disables zoom (`user-scalable=no`) and uses `viewport-fit=cover` for notch support.

## TypeScript

Strict mode with `noUnusedLocals` and `noUnusedParameters` enforced. `allowImportingTsExtensions` is enabled (import `.ts` files directly). Both `src/` and `scripts/` are included in compilation.

## Visual Style

Pixel art aesthetic throughout. Use sharp-edged rectangles instead of circles, avoid smooth gradients or anti-aliased shapes, and keep colors flat and bold. All game objects should look like they belong in a pixel art game.

## Working Style

The user is new to game development. Explain Phaser/game concepts (scenes, arcade physics, game loop, etc.) as they come up — don't assume familiarity.

Work in small, incremental steps. After each change, there should be something concrete and observable to verify before moving on. Never bundle multiple logical changes into one step.

Because there is no test framework, pull testable logic (physics calculations, spawn logic, scoring, etc.) out of Phaser scene classes into plain TypeScript functions or classes with no Phaser dependencies. This makes them easy to verify in isolation and to add tests to later.
