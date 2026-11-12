import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';

/**
 * High-DPI / iPhone Retina configuration:
 * We match physical device pixels (e.g. 2x on desktop Retina, 3x on modern iPhone OLEDs)
 * while maintaining the clean 450x800 logical portrait coordinate system.
 */
export const DPR =
  typeof window !== 'undefined'
    ? Math.min(Math.max(window.devicePixelRatio || 1, 1), 3)
    : 1;

export const LOGICAL_WIDTH = 450;
export const LOGICAL_HEIGHT = 800;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: LOGICAL_WIDTH * DPR,
  height: LOGICAL_HEIGHT * DPR,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
  },
  scene: [BootScene, CombatScene],
};

new Phaser.Game(config);
