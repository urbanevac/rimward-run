# Rimward Run — Combat Prototype (Phase 1 & 2)

A 9:16 portrait tactical card-battler / space-western smuggling roguelike built with **Vite + TypeScript (strict) + Phaser 3**. All art is generated procedurally at boot, so there are no external assets.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc type-check + production bundle in dist/
npm run test:engine  # headless CombatEngine smoke test (no Phaser)
```

## Architecture

| Path | Role |
|---|---|
| `src/types/game.ts` | Core interfaces (`Card`, `Enemy`, `EnemyIntent`, `Contract`, `GameState`, `CombatState`, results) |
| `src/data/seedData.ts` | 12-card crew deck, 2× Hot Stims contraband, *Unregistered Stims* contract, Alliance Customs Cutter |
| `src/engine/CombatEngine.ts` | Pure TS state machine: shuffle/draw/discard, AP, card resolution, contraband heat, airlock, enemy intents |
| `src/scenes/BootScene.ts` | Procedural textures (starfields, ships, card icons) |
| `src/scenes/CombatScene.ts` | Portrait UI, drag/hover gestures, floating text, WebAudio SFX, win/loss modal |
| `scripts/engine-smoke.ts` | Scripted headless rules checks |

## How to play

- **Drag a card above the console** (y < 480) to play it, if you have enough AP and credits.
- **Hot Stims** can't be played. Each copy left in your hand at End Turn adds **+10% Heat**. Drag it into the **AIRLOCK** (bottom-left) to destroy it for 0 AP, but this **voids the 120 Cr contract**.
- **Fast Talk** costs 15 Cr and cancels the Cutter's telegraphed intent for this turn.
- You **win** when the Cutter's hull hits 0. You **lose** when your hull hits 0 or Heat reaches 100%.
