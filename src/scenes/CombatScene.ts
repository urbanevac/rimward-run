import Phaser from 'phaser';
import { DPR } from '../main';
import { CombatEngine } from '../engine/CombatEngine';
import { Card, CardType, CombatState, EnemyIntent } from '../types/game';

interface CardVisual {
  card: Card;
  container: Phaser.GameObjects.Container;
  bgGraphics: Phaser.GameObjects.Graphics;
  homeX: number;
  homeY: number;
  homeAngle: number;
  baseDepth: number;
}

export class CombatScene extends Phaser.Scene {
  private static readonly PLAYER_HOME_X = 108;
  private static readonly ENEMY_HOME_X = 336;

  private engine!: CombatEngine;
  private outcomeModalTimer?: Phaser.Time.TimerEvent;

  // Parallax starfield
  private starsFar!: Phaser.GameObjects.TileSprite;
  private starsNear!: Phaser.GameObjects.TileSprite;

  // Top HUD elements
  private sectorHeaderTitleText!: Phaser.GameObjects.Text;
  private hullPillText!: Phaser.GameObjects.Text;
  private hullPillBg!: Phaser.GameObjects.Graphics;
  private fuelPillText!: Phaser.GameObjects.Text;
  private crPillText!: Phaser.GameObjects.Text;
  private lastDisplayedCredits = 65;
  private heatPillText!: Phaser.GameObjects.Text;
  private heatPillBg!: Phaser.GameObjects.Graphics;
  private contractBadgeBg!: Phaser.GameObjects.Graphics;
  private contractBadgeText!: Phaser.GameObjects.Text;

  // Diorama stage elements
  private stageHighlightGfx!: Phaser.GameObjects.Graphics;
  private stagePlayHintText!: Phaser.GameObjects.Text;
  private playerShipContainer!: Phaser.GameObjects.Container;
  private playerShipSprite!: Phaser.GameObjects.Image;
  private playerEvasionBadge!: Phaser.GameObjects.Container;
  private playerEvasionText!: Phaser.GameObjects.Text;
  private playerHullSubText!: Phaser.GameObjects.Text;

  private enemyShipContainer!: Phaser.GameObjects.Container;
  private enemyShipSprite!: Phaser.GameObjects.Image;
  private enemyNameLabel!: Phaser.GameObjects.Text;
  private enemyHullBarGfx!: Phaser.GameObjects.Graphics;
  private enemyHullText!: Phaser.GameObjects.Text;
  private enemyShieldBadge!: Phaser.GameObjects.Container;
  private enemyShieldText!: Phaser.GameObjects.Text;

  // Enemy intent callout box
  private intentBoxContainer!: Phaser.GameObjects.Container;
  private intentBoxBg!: Phaser.GameObjects.Graphics;
  private intentTitleText!: Phaser.GameObjects.Text;
  private intentSubText!: Phaser.GameObjects.Text;

  // Combat ticker & Action bar
  private tickerBg!: Phaser.GameObjects.Graphics;
  private tickerText!: Phaser.GameObjects.Text;
  private drawPileText!: Phaser.GameObjects.Text;
  private apOrbBg!: Phaser.GameObjects.Graphics;
  private apOrbText!: Phaser.GameObjects.Text;
  private discardPileText!: Phaser.GameObjects.Text;

  // Airlock & End Turn controls
  private airlockContainer!: Phaser.GameObjects.Container;
  private airlockBg!: Phaser.GameObjects.Graphics;
  private airlockTitleText!: Phaser.GameObjects.Text;
  private airlockSubText!: Phaser.GameObjects.Text;

  // Visual Effects & Particle Emitters
  private playerThrusterEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private enemyThrusterEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private combatSparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spaceDustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private playerShieldAura!: Phaser.GameObjects.Graphics;
  private enemyShieldAura!: Phaser.GameObjects.Graphics;
  private currentEnemySector = 0;

  private endTurnContainer!: Phaser.GameObjects.Container;
  private endTurnBg!: Phaser.GameObjects.Graphics;
  private endTurnText!: Phaser.GameObjects.Text;

  // Card hand visuals
  private cardVisuals: CardVisual[] = [];
  private isResolvingTurn = false;

  // Modal overlay
  private modalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'CombatScene' });
  }

  public create(): void {
    this.cameras.main.setOrigin(0, 0);
    this.cameras.main.setZoom(DPR);
    this.engine = new CombatEngine();
    this.isResolvingTurn = false;

    this.createBackgroundAndStage();
    this.createTopHud();
    this.createShipsAndIntentUI();
    this.createConsoleAndButtons();

    (window as any).__combatEngine = this.engine;
    (window as any).__combatScene = this;
    if ((import.meta as any).env?.DEV) {
      const killEnemy = () => {
        this.engine.debugTriggerVictory();
        this.refreshAllUI(true);
      };
      this.input.keyboard?.on('keydown-K', killEnemy);
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'k' || e.key === 'K') killEnemy();
      });
    }

    this.refreshAllUI(true);
  }

  public update(_time: number, delta: number): void {
    if (this.starsFar && this.starsNear) {
      this.starsFar.tilePositionX += delta * 0.008;
      this.starsNear.tilePositionX += delta * 0.022;
    }

    // Synchronize player plasma thruster emitter position
    if (this.playerThrusterEmitter && this.playerShipContainer && this.playerShipSprite) {
      this.playerThrusterEmitter.setPosition(
        this.playerShipContainer.x - 38,
        this.playerShipContainer.y + this.playerShipSprite.y
      );
    }

    // Synchronize enemy ion thruster emitter position
    if (this.enemyThrusterEmitter && this.enemyShipContainer && this.enemyShipSprite) {
      const state = this.engine ? this.engine.getState() : undefined;
      const xOffset = state?.sector.number === 3 ? 36 : (state?.sector.number === 2 ? 32 : 27);
      this.enemyThrusterEmitter.setPosition(
        this.enemyShipContainer.x + xOffset,
        this.enemyShipContainer.y + this.enemyShipSprite.y
      );
    }
  }

  // =========================================================================
  // 1. STAGE & BACKGROUND (Middle 40%: y = 118..435)
  // =========================================================================
  private createBackgroundAndStage(): void {
    // Full screen base background
    const baseBg = this.add.graphics();
    baseBg.fillStyle(0x0f172a, 1);
    baseBg.fillRect(0, 0, 450, 800);

    // Diorama viewport (y = 115 to 435)
    this.starsFar = this.add.tileSprite(225, 275, 450, 320, 'bg_stars_far').setTileScale(0.5, 0.5);
    this.starsNear = this.add.tileSprite(225, 275, 450, 320, 'bg_stars_near').setTileScale(0.5, 0.5);

    // Microscopic cosmic dust motes drifting across the diorama
    this.spaceDustEmitter = this.add.particles(0, 0, 'fx_dust_mote', {
      x: 455,
      y: { min: 130, max: 420 },
      speedX: { min: -22, max: -45 },
      speedY: { min: -3, max: 3 },
      scale: { min: 0.4, max: 0.9 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 11000,
      blendMode: 'ADD',
      frequency: 350,
    });
    this.spaceDustEmitter.setDepth(5);

    // Rim-planet horizon arc at bottom of diorama
    const horizonGfx = this.add.graphics();
    // Atmospheric glow
    horizonGfx.fillStyle(0xd97724, 0.14);
    horizonGfx.fillEllipse(225, 470, 560, 170);
    horizonGfx.fillStyle(0xeab308, 0.1);
    horizonGfx.fillEllipse(225, 465, 480, 130);
    // Planet curvature body
    horizonGfx.fillStyle(0x1e1b2e, 1);
    horizonGfx.fillEllipse(225, 485, 540, 140);
    horizonGfx.lineStyle(2, 0xd97724, 0.65);
    horizonGfx.strokeEllipse(225, 485, 540, 140);

    // Subtle tactical grid lines inside diorama
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x38bdf8, 0.06);
    for (let y = 160; y <= 400; y += 60) {
      gridGfx.lineBetween(0, y, 450, y);
    }
    for (let x = 75; x < 450; x += 75) {
      gridGfx.lineBetween(x, 115, x, 435);
    }

    // Play drop-zone highlight when dragging a card above y = 480
    this.stageHighlightGfx = this.add.graphics();
    this.stageHighlightGfx.setDepth(15);
    this.stagePlayHintText = this.addText(225, 392, '▲ RELEASE TO ENGAGE CARD ▲', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#fef08a',
        backgroundColor: '#0f172acc',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setAlpha(0);

    // Console lower backdrop panel (y = 435..800)
    const consoleBg = this.add.graphics();
    consoleBg.fillStyle(0x0b1120, 1);
    consoleBg.fillRect(0, 435, 450, 365);
    consoleBg.lineStyle(2, 0xd97724, 0.8);
    consoleBg.lineBetween(0, 435, 450, 435);
  }

  // =========================================================================
  // 2. TOP 15% — SHIP STATUS HUD (y = 0..115)
  // =========================================================================
  private createTopHud(): void {
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x090d18, 0.96);
    hudBg.fillRect(0, 0, 450, 115);
    hudBg.lineStyle(1.5, 0x334155, 1);
    hudBg.lineBetween(0, 115, 450, 115);

    // Header title bar
    this.sectorHeaderTitleText = this.addText(14, 8, 'RIMWARD RUN // SECTOR 1/3: SANTUBONG SHALLOWS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#d97724',
      })
      .setOrigin(0, 0);

    this.addText(436, 8, 'TACTICAL TELEMETRY', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#64748b',
      })
      .setOrigin(1, 0);

    // 4 Horizontal Status Pills at y = 30..64
    // Pill 1: HULL
    this.hullPillBg = this.add.graphics();
    this.hullPillText = this.addText(62, 47, 'HULL 30/30', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    // Pill 2: FUEL
    const fuelBg = this.add.graphics();
    fuelBg.fillStyle(0x1e293b, 1);
    fuelBg.fillRoundedRect(120, 30, 82, 34, 8);
    fuelBg.lineStyle(1.5, 0xd97724, 0.85);
    fuelBg.strokeRoundedRect(120, 30, 82, 34, 8);
    this.fuelPillText = this.addText(161, 47, 'FUEL 8', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fed7aa',
      })
      .setOrigin(0.5);

    // Pill 3: CREDITS
    const crBg = this.add.graphics();
    crBg.fillStyle(0x1e293b, 1);
    crBg.fillRoundedRect(208, 30, 96, 34, 8);
    crBg.lineStyle(1.5, 0xeab308, 0.9);
    crBg.strokeRoundedRect(208, 30, 96, 34, 8);
    this.crPillText = this.addText(256, 47, 'CR 65', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5);

    // Pill 4: HEAT
    this.heatPillBg = this.add.graphics();
    this.heatPillText = this.addText(376, 47, 'HEAT 25%', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#4ade80',
      })
      .setOrigin(0.5);

    // Active Contract Badge below HUD pills (y = 72..106)
    this.contractBadgeBg = this.add.graphics();
    this.contractBadgeText = this.addText(225, 89, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#fde68a',
      })
      .setOrigin(0.5);
  }

  // =========================================================================
  // 3. DIORAMA SHIPS & ENEMY INTENT CALLOUT (y = 120..430)
  // =========================================================================
  private createShipsAndIntentUI(): void {
    // --- LEFT: Player Freighter ---
    this.playerShipContainer = this.add.container(108, 298);

    // Player Terabai Shield Aura (renders behind player sprite)
    this.playerShieldAura = this.add.graphics();
    this.playerShipContainer.add(this.playerShieldAura);

    // Subtle engine hover tween
    this.playerShipSprite = this.add.image(0, 0, 'ship_player').setScale(0.5);
    this.playerShipContainer.add(this.playerShipSprite);

    const playerLabel = this.addText(0, 52, 'SS KENYALANG-IV (BEJALAI RUNNER)', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#d97724',
      })
      .setOrigin(0.5);
    this.playerShipContainer.add(playerLabel);

    this.playerHullSubText = this.addText(0, 66, 'HULL: 30/30', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);
    this.playerShipContainer.add(this.playerHullSubText);

    // Player Evasion Shield Badge
    this.playerEvasionBadge = this.add.container(0, -56);
    const evBg = this.add.graphics();
    evBg.fillStyle(0x0c4a6e, 0.94);
    evBg.beginPath();
    evBg.moveTo(0, -15);
    evBg.lineTo(56, -7);
    evBg.lineTo(56, 7);
    evBg.lineTo(0, 15);
    evBg.lineTo(-56, 7);
    evBg.lineTo(-56, -7);
    evBg.closePath();
    evBg.fillPath();
    evBg.lineStyle(1.5, 0x38bdf8, 1);
    evBg.strokePath();
    evBg.lineStyle(1, 0xfde68a, 0.6);
    evBg.lineBetween(0, -12, 0, 12);
    this.playerEvasionText = this.addText(0, 0, '🛡️ EVASION: 0', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.playerEvasionBadge.add([evBg, this.playerEvasionText]);
    this.playerShipContainer.add(this.playerEvasionBadge);

    this.tweens.add({
      targets: this.playerShipSprite,
      y: -5,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.playerShipSprite,
      angle: 1.6,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- RIGHT: Alliance Customs Cutter ---
    this.enemyShipContainer = this.add.container(336, 298);

    // Enemy Shield Aura (renders behind enemy sprite)
    this.enemyShieldAura = this.add.graphics();
    this.enemyShipContainer.add(this.enemyShieldAura);

    this.enemyShipSprite = this.add.image(0, 0, 'ship_enemy').setScale(0.5);
    this.enemyShipSprite.setInteractive({ useHandCursor: true });
    this.enemyShipSprite.on('pointerdown', () => {
      this.engine.debugTriggerVictory();
      this.refreshAllUI(true);
    });
    this.enemyShipContainer.add(this.enemyShipSprite);

    this.enemyNameLabel = this.addText(0, 46, 'CUSTOMS PATROL SKIFF', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);
    this.enemyShipContainer.add(this.enemyNameLabel);

    // Enemy Hull Bar & Shield Badge
    this.enemyHullBarGfx = this.add.graphics();
    this.enemyShipContainer.add(this.enemyHullBarGfx);

    this.enemyHullText = this.addText(0, 66, 'HULL 48/48', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10.5px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.enemyShipContainer.add(this.enemyHullText);

    this.enemyShieldBadge = this.add.container(0, 90);
    const shdBg = this.add.graphics();
    shdBg.fillStyle(0x0284c7, 0.9);
    shdBg.fillRoundedRect(-48, -11, 96, 22, 5);
    shdBg.lineStyle(1.5, 0x7dd3fc, 1);
    shdBg.strokeRoundedRect(-48, -11, 96, 22, 5);
    this.enemyShieldText = this.addText(0, 0, '🛡️ SHIELD: 0', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      })
      .setOrigin(0.5);
    this.enemyShieldBadge.add([shdBg, this.enemyShieldText]);
    this.enemyShipContainer.add(this.enemyShieldBadge);

    this.tweens.add({
      targets: this.enemyShipSprite,
      y: 5,
      duration: 2100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.enemyShipSprite,
      angle: -1.6,
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Real-Time Animated Plasma Thrusters (Player Freighter)
    this.playerThrusterEmitter = this.add.particles(0, 0, 'fx_plasma_flare', {
      speed: { min: 45, max: 95 },
      angle: { min: 172, max: 188 },
      scale: { start: 0.65, end: 0.05 },
      alpha: { start: 0.85, end: 0 },
      tint: [0xffffff, 0xfef08a, 0xf59e0b, 0xe09f3e],
      lifespan: { min: 240, max: 420 },
      blendMode: 'ADD',
      frequency: 24,
    });
    this.playerThrusterEmitter.setDepth(18);

    // Combat Spark Explosion Emitter
    this.combatSparkEmitter = this.add.particles(0, 0, 'fx_spark', {
      speed: { min: 80, max: 230 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, 0xfef08a, 0xf59e0b, 0xef4444],
      lifespan: { min: 250, max: 550 },
      blendMode: 'ADD',
      emitting: false,
    });
    this.combatSparkEmitter.setDepth(60);

    // Initialize Enemy Thruster Emitter for Sector 1
    this.initEnemyThruster(1);

    // --- Prominent Enemy Intent Callout Box above Cutter (x = 315, y = 172) ---
    this.intentBoxContainer = this.add.container(312, 172);
    this.intentBoxBg = this.add.graphics();
    this.intentTitleText = this.addText(0, -9, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5);
    this.intentSubText = this.addText(0, 10, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);
    this.intentBoxContainer.add([this.intentBoxBg, this.intentTitleText, this.intentSubText]);
  }

  // =========================================================================
  // 4. BOTTOM 45% — THUMB CONSOLE, ACTION BAR, AIRLOCK & END TURN
  // =========================================================================
  private createConsoleAndButtons(): void {
    // Combat Log Ticker (y = 438..468)
    this.tickerBg = this.add.graphics();
    this.tickerBg.fillStyle(0x1e293b, 0.9);
    this.tickerBg.fillRect(0, 437, 450, 30);
    this.tickerBg.lineStyle(1, 0x334155, 1);
    this.tickerBg.lineBetween(0, 467, 450, 467);

    this.tickerText = this.addText(225, 452, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fde68a',
      })
      .setOrigin(0.5);

    // Action Bar (y = 474..514): Draw (X) left, AP: 3/3 center, Discard (X) right
    const drawBg = this.add.graphics();
    drawBg.fillStyle(0x1e293b, 1);
    drawBg.fillRoundedRect(16, 477, 114, 32, 8);
    drawBg.lineStyle(1.5, 0x475569, 1);
    drawBg.strokeRoundedRect(16, 477, 114, 32, 8);
    this.drawPileText = this.addText(73, 493, 'DRAW (10)', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.apOrbBg = this.add.graphics();
    this.apOrbText = this.addText(225, 493, '⚡ AP: 3/3', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13.5px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5);

    const discardBg = this.add.graphics();
    discardBg.fillStyle(0x1e293b, 1);
    discardBg.fillRoundedRect(320, 477, 114, 32, 8);
    discardBg.lineStyle(1.5, 0x475569, 1);
    discardBg.strokeRoundedRect(320, 477, 114, 32, 8);
    this.discardPileText = this.addText(377, 493, 'DISCARD (0)', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    // Bottom-Left AIRLOCK Drop Zone (x = 16..205, y = 720..786)
    this.airlockContainer = this.add.container(110, 753);
    this.airlockBg = this.add.graphics();
    this.airlockTitleText = this.addText(0, -8, '☢️ AIRLOCK JETTISON', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f87171',
      })
      .setOrigin(0.5);
    this.airlockSubText = this.addText(0, 10, 'DRAG CONTRABAND (0 AP)', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9.5px',
        color: '#fca5a5',
      })
      .setOrigin(0.5);
    this.airlockContainer.add([this.airlockBg, this.airlockTitleText, this.airlockSubText]);
    this.drawAirlockBox(false, false);

    // Bottom-Right END TURN Button (x = 225..434, y = 720..786)
    this.endTurnContainer = this.add.container(330, 753);
    this.endTurnBg = this.add.graphics();
    this.endTurnText = this.addText(0, -6, 'END TURN ▶', {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#0f172a',
      })
      .setOrigin(0.5);
    const endTurnSub = this.addText(0, 12, 'EXECUTE ENEMY INTENT', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9.5px',
        fontStyle: 'bold',
        color: '#451a03',
      })
      .setOrigin(0.5);
    this.endTurnContainer.add([this.endTurnBg, this.endTurnText, endTurnSub]);
    this.drawEndTurnButton(false);

    const endTurnHitArea = this.add
      .zone(330, 753, 208, 64)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    endTurnHitArea.on('pointerover', () => {
      if (!this.isResolvingTurn && this.engine.getState().outcome === 'ONGOING') {
        this.drawEndTurnButton(true);
      }
    });
    endTurnHitArea.on('pointerout', () => {
      this.drawEndTurnButton(false);
    });
    endTurnHitArea.on('pointerdown', () => {
      if (this.isResolvingTurn || this.engine.getState().outcome !== 'ONGOING') return;
      this.handleEndTurnClicked();
    });
  }

  private drawAirlockBox(activeHighlight: boolean, intenseHover: boolean): void {
    this.airlockBg.clear();
    if (intenseHover) {
      this.airlockBg.fillStyle(0x991b1b, 0.95);
      this.airlockBg.fillRoundedRect(-94, -32, 188, 64, 10);
      this.airlockBg.lineStyle(3, 0xfef08a, 1);
      this.airlockBg.strokeRoundedRect(-94, -32, 188, 64, 10);
      this.airlockTitleText.setText('⚠️ RELEASE TO DUMP!');
      this.airlockSubText.setText('VOIDS 120 CR CONTRACT');
    } else if (activeHighlight) {
      this.airlockBg.fillStyle(0x7f1d1d, 0.8);
      this.airlockBg.fillRoundedRect(-94, -32, 188, 64, 10);
      this.airlockBg.lineStyle(2.5, 0xef4444, 1);
      this.airlockBg.strokeRoundedRect(-94, -32, 188, 64, 10);
      this.airlockTitleText.setText('☢️ DROP HERE TO VENT');
      this.airlockSubText.setText('0 AP • VOIDS CONTRACT');
    } else {
      this.airlockBg.fillStyle(0x2a1215, 0.85);
      this.airlockBg.fillRoundedRect(-94, -32, 188, 64, 10);
      this.airlockBg.lineStyle(1.5, 0xef4444, 0.65);
      this.airlockBg.strokeRoundedRect(-94, -32, 188, 64, 10);
      this.airlockTitleText.setText('☢️ AIRLOCK JETTISON');
      this.airlockSubText.setText('DRAG CONTRABAND (0 AP)');
    }
  }

  private drawEndTurnButton(hovered: boolean): void {
    this.endTurnBg.clear();
    const fillColor = hovered ? 0xfacc15 : 0xd97724;
    const strokeColor = hovered ? 0xfef08a : 0xeab308;
    this.endTurnBg.fillStyle(fillColor, 1);
    this.endTurnBg.fillRoundedRect(-104, -32, 208, 64, 10);
    this.endTurnBg.lineStyle(2.5, strokeColor, 1);
    this.endTurnBg.strokeRoundedRect(-104, -32, 208, 64, 10);
  }

  // =========================================================================
  // 5. UI SYNCHRONIZATION & CARD HAND RENDERING
  // =========================================================================
  private refreshAllUI(rebuildHand: boolean): void {
    const state = this.engine.getState();

    // 1. Update Top HUD Pills
    this.updateTopHud(state);

    // 2. Update Player & Enemy Ship Displays
    this.updateShipsAndIntent(state);

    // 3. Update Combat Ticker & Action Bar
    this.setTicker(state.lastLog);
    this.drawPileText.setText(`DRAW (${state.drawPile.length})`);
    this.discardPileText.setText(`DISCARD (${state.discardPile.length})`);

    this.apOrbBg.clear();
    const apColor = state.player.ap > 0 ? 0xd97724 : 0x475569;
    this.apOrbBg.fillStyle(0x1e293b, 1);
    this.apOrbBg.fillRoundedRect(148, 474, 154, 38, 18);
    this.apOrbBg.lineStyle(2.5, apColor, 1);
    this.apOrbBg.strokeRoundedRect(148, 474, 154, 38, 18);
    this.apOrbText.setText(`✦ AP: ${state.player.ap}/${state.player.maxAp} ✦`);
    this.apOrbText.setColor(state.player.ap > 0 ? '#fef08a' : '#94a3b8');

    // 4. Rebuild Card Hand
    if (rebuildHand) {
      this.renderHand(state);
    }

    // 5. Show Victory/Defeat modal if encounter finished (schedule exactly once)
    if (state.outcome !== 'ONGOING' && !this.modalContainer && !this.outcomeModalTimer) {
      this.outcomeModalTimer = this.time.delayedCall(450, () => {
        this.showOutcomeModal(this.engine.getState());
      });
    }
  }

  private cancelPendingModal(): void {
    if (this.outcomeModalTimer) {
      this.outcomeModalTimer.remove(false);
      this.outcomeModalTimer = undefined;
    }
  }

  /** Single-line ticker: truncate with an ellipsis to fit the 30px bar. */
  private setTicker(message: string): void {
    const maxWidth = 432;
    this.tickerText.setText(message);
    if (this.tickerText.width <= maxWidth) return;
    let lo = 0;
    let hi = message.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      this.tickerText.setText(message.slice(0, mid) + '…');
      if (this.tickerText.width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    this.tickerText.setText(message.slice(0, lo).trimEnd() + '…');
  }

  private updateTopHud(state: CombatState): void {
    // Sector header
    if (this.sectorHeaderTitleText) {
      this.sectorHeaderTitleText.setText(
        `RIMWARD RUN // SECTOR ${state.sector.number}/${state.sector.maxSectors}: ${state.sector.name.toUpperCase()}`
      );
    }

    // Hull pill
    const hullRatio = state.player.hull / state.player.maxHull;
    const hullBorderColor = hullRatio > 0.5 ? 0xd97724 : hullRatio > 0.25 ? 0xeab308 : 0xef4444;
    this.hullPillBg.clear();
    this.hullPillBg.fillStyle(0x1e293b, 1);
    this.hullPillBg.fillRoundedRect(12, 30, 102, 34, 8);
    this.hullPillBg.lineStyle(1.5, hullBorderColor, 1);
    this.hullPillBg.strokeRoundedRect(12, 30, 102, 34, 8);
    this.hullPillText.setText(`HULL ${state.player.hull}/${state.player.maxHull}`);
    this.hullPillText.setColor(hullRatio <= 0.25 ? '#fca5a5' : '#f8fafc');

    // Fuel & Credits
    this.fuelPillText.setText(`FUEL ${state.player.fuel}`);
    if (this.lastDisplayedCredits !== undefined && state.player.credits !== this.lastDisplayedCredits) {
      const delta = state.player.credits - this.lastDisplayedCredits;
      this.tweens.add({
        targets: this.crPillText,
        scale: 1.25,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      if (delta > 0) {
        this.spawnFloatingText(256, 74, `+${delta} Cr`, '#facc15');
      } else if (delta < 0) {
        this.spawnFloatingText(256, 74, `${delta} Cr`, '#f87171');
      }
    }
    this.lastDisplayedCredits = state.player.credits;
    this.crPillText.setText(`CR ${state.player.credits}`);

    // Heat pill (color-coded green -> amber -> red)
    const heat = state.player.heat;
    let heatStroke = 0x22c55e;
    let heatTextHex = '#4ade80';
    if (heat >= 75) {
      heatStroke = 0xef4444;
      heatTextHex = '#f87171';
    } else if (heat >= 50) {
      heatStroke = 0xeab308;
      heatTextHex = '#facc15';
    }
    this.heatPillBg.clear();
    this.heatPillBg.fillStyle(0x1e293b, 1);
    this.heatPillBg.fillRoundedRect(310, 30, 128, 34, 8);
    this.heatPillBg.lineStyle(2, heatStroke, 1);
    this.heatPillBg.strokeRoundedRect(310, 30, 128, 34, 8);
    this.heatPillText.setText(`HEAT ${heat}%`);
    this.heatPillText.setColor(heatTextHex);

    // Contract badge
    this.contractBadgeBg.clear();
    if (!state.contract.voided) {
      this.contractBadgeBg.fillStyle(0x1c1917, 0.95);
      this.contractBadgeBg.fillRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeBg.lineStyle(1.5, 0xeab308, 0.85);
      this.contractBadgeBg.strokeRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeText.setText(
        `📦 BEJALAI CONTRACT: ${state.contract.name} — PAYOUT: ${state.contract.payout} Cr`
      );
      this.contractBadgeText.setColor('#fde68a');
    } else {
      this.contractBadgeBg.fillStyle(0x3b1219, 0.95);
      this.contractBadgeBg.fillRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeBg.lineStyle(1.5, 0xef4444, 0.95);
      this.contractBadgeBg.strokeRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeText.setText(
        `⚠️ BEJALAI CONTRACT: ${state.contract.name} — [JETTISONED / 0 Cr]`
      );
      this.contractBadgeText.setColor('#fca5a5');
    }
  }

  private initEnemyThruster(sectorNumber: number): void {
    if (this.enemyThrusterEmitter) {
      this.enemyThrusterEmitter.destroy();
    }
    this.currentEnemySector = sectorNumber;

    if (sectorNumber === 3) {
      // Sector 3 Dreadnought: Heavy rumbling red/orange rocket plume
      this.enemyThrusterEmitter = this.add.particles(0, 0, 'fx_plasma_flare', {
        speed: { min: 60, max: 120 },
        angle: { min: -10, max: 10 },
        scale: { start: 0.85, end: 0.1 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffffff, 0xfef08a, 0xf97316, 0xef4444],
        lifespan: { min: 280, max: 480 },
        blendMode: 'ADD',
        frequency: 20,
      });
    } else if (sectorNumber === 2) {
      // Sector 2 Cutter: Twin deep azure/cyan ion thrusters
      this.enemyThrusterEmitter = this.add.particles(0, 0, 'fx_ion_flare', {
        speed: { min: 50, max: 95 },
        angle: { min: -8, max: 8 },
        scale: { start: 0.65, end: 0.08 },
        alpha: { start: 0.85, end: 0 },
        tint: [0xffffff, 0xbae6fd, 0x38bdf8, 0x0284c7],
        lifespan: { min: 230, max: 390 },
        blendMode: 'ADD',
        frequency: 22,
      });
    } else {
      // Sector 1 Skiff: Fast cyan/white ion needle
      this.enemyThrusterEmitter = this.add.particles(0, 0, 'fx_ion_flare', {
        speed: { min: 45, max: 85 },
        angle: { min: -6, max: 6 },
        scale: { start: 0.5, end: 0.05 },
        alpha: { start: 0.85, end: 0 },
        tint: [0xffffff, 0x7dd3fc, 0x38bdf8],
        lifespan: { min: 200, max: 340 },
        blendMode: 'ADD',
        frequency: 25,
      });
    }
    this.enemyThrusterEmitter.setDepth(18);
  }

  private drawShieldAuras(state: CombatState): void {
    // Player Terabai Shield Aura
    this.playerShieldAura.clear();
    if (state.player.evasion > 0) {
      this.playerShieldAura.setVisible(true);
      this.playerShieldAura.fillStyle(0x0284c7, 0.16);
      this.playerShieldAura.beginPath();
      this.playerShieldAura.moveTo(0, -32);
      this.playerShieldAura.lineTo(52, -14);
      this.playerShieldAura.lineTo(52, 14);
      this.playerShieldAura.lineTo(0, 32);
      this.playerShieldAura.lineTo(-52, 14);
      this.playerShieldAura.lineTo(-52, -14);
      this.playerShieldAura.closePath();
      this.playerShieldAura.fillPath();
      this.playerShieldAura.lineStyle(1.8, 0x38bdf8, 0.85);
      this.playerShieldAura.strokePath();
      this.playerShieldAura.lineStyle(1, 0xfde68a, 0.5);
      this.playerShieldAura.lineBetween(0, -28, 0, 28);
    } else {
      this.playerShieldAura.setVisible(false);
    }

    // Enemy Shield Aura
    this.enemyShieldAura.clear();
    if (state.enemy.shield > 0) {
      this.enemyShieldAura.setVisible(true);
      this.enemyShieldAura.fillStyle(0x0c4a6e, 0.18);
      this.enemyShieldAura.beginPath();
      this.enemyShieldAura.moveTo(0, -34);
      this.enemyShieldAura.lineTo(56, -16);
      this.enemyShieldAura.lineTo(56, 16);
      this.enemyShieldAura.lineTo(0, 34);
      this.enemyShieldAura.lineTo(-56, 16);
      this.enemyShieldAura.lineTo(-56, -16);
      this.enemyShieldAura.closePath();
      this.enemyShieldAura.fillPath();
      this.enemyShieldAura.lineStyle(1.8, 0x7dd3fc, 0.85);
      this.enemyShieldAura.strokePath();
    } else {
      this.enemyShieldAura.setVisible(false);
    }
  }

  private updateShipsAndIntent(state: CombatState): void {
    // Reconfigure enemy thruster if sector changed
    if (this.currentEnemySector !== state.sector.number) {
      this.initEnemyThruster(state.sector.number);
    }
    // Update live shield auras
    this.drawShieldAuras(state);

    // Dynamic enemy ship texture & label
    if (this.enemyShipSprite && state.enemy.spriteKey) {
      this.enemyShipSprite.setTexture(state.enemy.spriteKey);
    }
    if (this.enemyNameLabel) {
      this.enemyNameLabel.setText(state.enemy.name.toUpperCase());
    }

    // Player Evasion & Hull label
    this.playerHullSubText.setText(`HULL: ${state.player.hull}/${state.player.maxHull}`);
    this.playerEvasionText.setText(`🛡️ EVASION: ${state.player.evasion}`);
    this.playerEvasionBadge.setAlpha(state.player.evasion > 0 ? 1 : 0.55);

    // Enemy Hull Bar
    this.enemyHullBarGfx.clear();
    const barW = 132;
    const barH = 12;
    const barX = -barW / 2;
    const barY = 60;
    this.enemyHullBarGfx.fillStyle(0x0f172a, 0.95);
    this.enemyHullBarGfx.fillRoundedRect(barX, barY, barW, barH, 4);

    const pct = Phaser.Math.Clamp(state.enemy.hull / state.enemy.maxHull, 0, 1);
    if (pct > 0) {
      this.enemyHullBarGfx.fillStyle(0xef4444, 1);
      this.enemyHullBarGfx.fillRoundedRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2, 3);
    }
    this.enemyHullBarGfx.lineStyle(1.5, 0x38bdf8, 0.9);
    this.enemyHullBarGfx.strokeRoundedRect(barX, barY, barW, barH, 4);
    this.enemyHullText.setText(`HULL ${state.enemy.hull}/${state.enemy.maxHull}`);

    // Enemy Shield Badge
    this.enemyShieldText.setText(`🛡️ SHIELD: ${state.enemy.shield}`);
    this.enemyShieldBadge.setAlpha(state.enemy.shield > 0 ? 1 : 0.45);

    // Enemy Intent Callout Box
    const intent: EnemyIntent = state.enemy.currentIntent;
    this.intentBoxBg.clear();
    const boxW = 236;
    const boxH = 52;

    if (intent.cancelled) {
      this.intentBoxBg.fillStyle(0x1e293b, 0.94);
      this.intentBoxBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
      this.intentBoxBg.lineStyle(2, 0x94a3b8, 0.8);
      this.intentBoxBg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
      this.intentTitleText.setText(`🔇 [JAMMED] ${intent.name.toUpperCase()}`);
      this.intentTitleText.setColor('#94a3b8');
      this.intentSubText.setText('Comms spoofed — No action this turn');
      this.intentSubText.setColor('#64748b');
    } else {
      let borderCol = 0x38bdf8;
      let iconPrefix = '🛡️';
      let titleCol = '#7dd3fc';

      if (intent.id === 'CARGO_SCAN') {
        borderCol = 0xeab308;
        iconPrefix = '⚠️';
        titleCol = '#fde047';
      } else if (intent.id === 'WARNING_SHOT' || intent.id === 'BROADSIDE') {
        borderCol = 0xef4444;
        iconPrefix = '💥';
        titleCol = '#fca5a5';
      }

      this.intentBoxBg.fillStyle(0x0f172a, 0.95);
      this.intentBoxBg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
      this.intentBoxBg.lineStyle(2, borderCol, 1);
      this.intentBoxBg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);

      // Callout pointer triangle pointing down to Cutter
      this.intentBoxBg.fillStyle(borderCol, 1);
      this.intentBoxBg.fillTriangle(12, boxH / 2, 26, boxH / 2, 19, boxH / 2 + 9);

      this.intentTitleText.setText(`${iconPrefix} ${intent.badgeText}`);
      this.intentTitleText.setColor(titleCol);
      this.intentSubText.setText(intent.description);
      this.intentSubText.setColor('#e2e8f0');
    }
  }

  // =========================================================================
  // 6. 4-CARD FAN & TOUCH/MOUSE GESTURES
  // =========================================================================
  private getRoleColors(type: CardType): { stripe: number; border: number; badgeText: string } {
    switch (type) {
      case 'Mercenary':
        return { stripe: 0x9e2a2b, border: 0xc85a32, badgeText: '#fed7aa' };
      case 'Pilot':
        return { stripe: 0x0369a1, border: 0x38bdf8, badgeText: '#bae6fd' };
      case 'Mechanic':
        return { stripe: 0x15803d, border: 0x4ade80, badgeText: '#bbf7d0' };
      case 'Captain':
        return { stripe: 0xb45309, border: 0xe09f3e, badgeText: '#fef08a' };
      case 'Contraband':
        return { stripe: 0x7f1d1d, border: 0xef4444, badgeText: '#fecaca' };
    }
  }

  private renderHand(state: CombatState): void {
    // Destroy previous card visuals (kill in-flight tweens first so their
    // onComplete callbacks never touch a destroyed container)
    for (const cv of this.cardVisuals) {
      this.tweens.killTweensOf(cv.container);
      cv.container.destroy();
    }
    this.cardVisuals = [];

    const hand = state.hand;
    const count = hand.length;
    if (count === 0) return;

    const cardWidth = 98;
    const cardHeight = 148;
    const centerY = 612;

    // Fan spacing across 450px width
    const totalSpread = Math.min(342, (count - 1) * 104);
    const startX = 225 - totalSpread / 2;
    const stepX = count > 1 ? totalSpread / (count - 1) : 0;

    hand.forEach((card, index) => {
      const norm = count > 1 ? (index / (count - 1)) * 2 - 1 : 0; // -1 to +1
      const homeX = startX + index * stepX;
      const homeY = centerY + Math.abs(norm) * 8;
      const homeAngle = norm * 4.5;
      const baseDepth = 20 + index;

      const container = this.add.container(homeX, homeY);
      container.setSize(cardWidth, cardHeight);
      container.setAngle(homeAngle);
      container.setDepth(baseDepth);

      const check = this.engine.canPlayCard(card.instanceId);
      const isContraband = card.type === 'Contraband';
      const roleColors = this.getRoleColors(card.type);

      const bgGraphics = this.add.graphics();
      this.drawCardFrame(bgGraphics, card, check.playable, false);
      container.add(bgGraphics);

      // Role label inside the color stripe (right of the AP badge)
      const roleLabel = this.addText(8, -cardHeight / 2 + 15, card.type.toUpperCase(), {
          fontFamily: 'Courier New, monospace',
          fontSize: '8.5px',
          fontStyle: 'bold',
          color: roleColors.badgeText,
        })
        .setOrigin(0.5);
      container.add(roleLabel);

      // AP Cost Badge (top-left corner)
      const costBadgeGfx = this.add.graphics();
      const badgeCol = isContraband ? 0xef4444 : check.playable ? 0xeab308 : 0x475569;
      costBadgeGfx.fillStyle(0x0f172a, 1);
      costBadgeGfx.fillCircle(-cardWidth / 2 + 16, -cardHeight / 2 + 16, 12);
      costBadgeGfx.lineStyle(2, badgeCol, 1);
      costBadgeGfx.strokeCircle(-cardWidth / 2 + 16, -cardHeight / 2 + 16, 12);
      container.add(costBadgeGfx);

      const costString = isContraband ? '!' : `${card.apCost}`;
      const costText = this.addText(-cardWidth / 2 + 16, -cardHeight / 2 + 16, costString, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: isContraband ? '#f87171' : check.playable ? '#fef08a' : '#94a3b8',
        })
        .setOrigin(0.5);
      container.add(costText);

      // Credit cost tag if applicable (Fast Talk)
      if (card.creditCost) {
        const crTag = this.addText(cardWidth / 2 - 11, -17, `-${card.creditCost}Cr`, {
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            fontStyle: 'bold',
            color: state.player.credits >= card.creditCost ? '#fde047' : '#f87171',
          })
          .setOrigin(1, 0.5);
        container.add(crTag);
      }

      // Card Title
      const titleText = this.addText(0, -36, card.title, {
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#f8fafc',
          align: 'center',
          wordWrap: { width: cardWidth - 10 },
        })
        .setOrigin(0.5);
      container.add(titleText);

      // Procedural Card Icon
      const iconImg = this.add.image(0, -4, card.iconKey).setScale(0.425);
      container.add(iconImg);

      // Crisp Rules Text
      const descText = this.addText(0, 43, card.description, {
          fontFamily: 'Courier New, monospace',
          fontSize: '9.5px',
          color: isContraband ? '#fecaca' : '#cbd5e1',
          align: 'center',
          wordWrap: { width: cardWidth - 12 },
          lineSpacing: 2,
        })
        .setOrigin(0.5);
      container.add(descText);

      const visual: CardVisual = {
        card,
        container,
        bgGraphics,
        homeX,
        homeY,
        homeAngle,
        baseDepth,
      };
      this.cardVisuals.push(visual);

      this.attachCardInteractions(visual);
    });
  }

  private drawCardFrame(
    gfx: Phaser.GameObjects.Graphics,
    card: Card,
    playable: boolean,
    highlighted: boolean
  ): void {
    const w = 98;
    const h = 148;
    const bevel = 6;
    const roleColors = this.getRoleColors(card.type);
    const isContraband = card.type === 'Contraband';

    gfx.clear();

    // Terabai faceted war shield body
    const bodyFill = isContraband ? 0x2c0b0e : 0x151d2c;
    gfx.fillStyle(bodyFill, 0.98);
    gfx.beginPath();
    gfx.moveTo(-w / 2 + bevel, -h / 2);
    gfx.lineTo(w / 2 - bevel, -h / 2);
    gfx.lineTo(w / 2, -h / 2 + bevel);
    gfx.lineTo(w / 2, h / 2 - bevel);
    gfx.lineTo(w / 2 - bevel, h / 2);
    gfx.lineTo(-w / 2 + bevel, h / 2);
    gfx.lineTo(-w / 2, h / 2 - bevel);
    gfx.lineTo(-w / 2, -h / 2 + bevel);
    gfx.closePath();
    gfx.fillPath();

    // Role color stripe across top
    gfx.fillStyle(roleColors.stripe, 0.92);
    gfx.beginPath();
    gfx.moveTo(-w / 2 + bevel, -h / 2 + 2);
    gfx.lineTo(w / 2 - bevel, -h / 2 + 2);
    gfx.lineTo(w / 2 - 2, -h / 2 + bevel);
    gfx.lineTo(w / 2 - 2, -h / 2 + 26);
    gfx.lineTo(-w / 2 + 2, -h / 2 + 26);
    gfx.lineTo(-w / 2 + 2, -h / 2 + bevel);
    gfx.closePath();
    gfx.fillPath();

    // Inner artwork frame with Dayak diamond notches
    gfx.fillStyle(0x070c18, 0.92);
    gfx.fillRoundedRect(-w / 2 + 8, -22, w - 16, 36, 4);

    // Outer Terabai stroke
    const borderCol = highlighted
      ? 0xfef08a
      : isContraband
      ? 0xef4444
      : playable
      ? roleColors.border
      : 0x475569;
    const borderThickness = highlighted ? 2.8 : playable || isContraband ? 2 : 1.5;
    gfx.lineStyle(borderThickness, borderCol, 1);
    gfx.beginPath();
    gfx.moveTo(-w / 2 + bevel, -h / 2);
    gfx.lineTo(w / 2 - bevel, -h / 2);
    gfx.lineTo(w / 2, -h / 2 + bevel);
    gfx.lineTo(w / 2, h / 2 - bevel);
    gfx.lineTo(w / 2 - bevel, h / 2);
    gfx.lineTo(-w / 2 + bevel, h / 2);
    gfx.lineTo(-w / 2, h / 2 - bevel);
    gfx.lineTo(-w / 2, -h / 2 + bevel);
    gfx.closePath();
    gfx.strokePath();

    // Central spine accent
    gfx.lineStyle(1, borderCol, 0.35);
    gfx.lineBetween(0, 24, 0, h / 2 - bevel);
  }

  private attachCardInteractions(visual: CardVisual): void {
    const { container, card } = visual;
    container.setInteractive({ draggable: true, useHandCursor: true });

    let isDragging = false;

    const lowerCard = (): void => {
      if (!container.active) return;
      const check = this.engine.canPlayCard(card.instanceId);
      this.drawCardFrame(visual.bgGraphics, card, check.playable, false);
      this.tweens.killTweensOf(container);
      this.tweens.add({
        targets: container,
        x: visual.homeX,
        y: visual.homeY,
        scaleX: 1,
        scaleY: 1,
        angle: visual.homeAngle,
        duration: 140,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (container.active) container.setDepth(visual.baseDepth);
        },
      });
    };

    container.on('pointerover', () => {
      if (isDragging || this.isResolvingTurn) return;
      container.setDepth(60);
      const check = this.engine.canPlayCard(card.instanceId);
      this.drawCardFrame(visual.bgGraphics, card, check.playable, true);
      this.tweens.killTweensOf(container);
      this.tweens.add({
        targets: container,
        y: visual.homeY - 22,
        scaleX: 1.12,
        scaleY: 1.12,
        angle: 0,
        duration: 130,
        ease: 'Back.easeOut',
      });
    });

    container.on('pointerout', () => {
      if (isDragging || this.isResolvingTurn) return;
      lowerCard();
    });

    // Touch devices often skip pointerout after a tap — lower on release
    container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (isDragging || this.isResolvingTurn) return;
      if (pointer.wasTouch) lowerCard();
    });

    container.on('dragstart', () => {
      if (this.isResolvingTurn || this.engine.getState().outcome !== 'ONGOING') return;
      isDragging = true;
      container.setDepth(90);
      this.tweens.killTweensOf(container);
      container.setScale(1.12);
      container.setAngle(0);
      this.sfx('pickup');

      if (card.type === 'Contraband') {
        this.drawAirlockBox(true, false);
      }
    });

    container.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (!isDragging) return;
        container.setPosition(dragX, dragY);

        const isContraband = card.type === 'Contraband';
        const overAirlock = this.isPointInsideAirlock(dragX, dragY);
        const overPlayStage = dragY < 480;

        this.stageHighlightGfx.clear();

        if (isContraband) {
          this.drawAirlockBox(true, overAirlock);
          if (overPlayStage) {
            this.stageHighlightGfx.lineStyle(2, 0xef4444, 0.8);
            this.stageHighlightGfx.strokeRoundedRect(10, 120, 430, 310, 10);
            this.stagePlayHintText
              .setText('⚠️ UNPLAYABLE — DRAG TO AIRLOCK BELOW')
              .setColor('#fca5a5')
              .setAlpha(1);
          } else {
            this.stagePlayHintText.setAlpha(0);
          }
        } else {
          const check = this.engine.canPlayCard(card.instanceId);
          if (overPlayStage) {
            const hlColor = check.playable ? 0xeab308 : 0xef4444;
            this.stageHighlightGfx.lineStyle(2.5, hlColor, 0.9);
            this.stageHighlightGfx.strokeRoundedRect(10, 120, 430, 310, 10);
            this.stagePlayHintText
              .setText(
                check.playable
                  ? `▲ RELEASE TO PLAY ${card.title.toUpperCase()} (-${card.apCost} AP) ▲`
                  : `✖ ${check.reason?.toUpperCase() ?? 'CANNOT PLAY'}`
              )
              .setColor(check.playable ? '#fef08a' : '#fca5a5')
              .setAlpha(1);
          } else {
            this.stagePlayHintText.setAlpha(0);
          }
        }
      }
    );

    container.on('dragend', () => {
      if (!isDragging) return;
      isDragging = false;
      this.stageHighlightGfx.clear();
      this.stagePlayHintText.setAlpha(0);
      this.drawAirlockBox(false, false);

      const dropX = container.x;
      const dropY = container.y;

      // 1. Check Airlock Jettison Drop Zone
      if (this.isPointInsideAirlock(dropX, dropY)) {
        if (card.type === 'Contraband') {
          this.executeJettisonCard(visual);
          return;
        } else {
          this.spawnFloatingText(dropX, dropY - 20, 'ONLY CONTRABAND CAN BE JETTISONED!', '#fecaca');
          this.sfx('deny');
          this.snapCardBack(visual);
          return;
        }
      }

      // 2. Check Play Stage Drop Zone (above y = 480)
      if (dropY < 480) {
        const check = this.engine.canPlayCard(card.instanceId);
        if (check.playable) {
          this.executePlayCard(visual);
          return;
        } else {
          this.spawnFloatingText(
            dropX,
            Math.max(160, dropY - 25),
            check.reason ?? 'Cannot play!',
            '#fecaca'
          );
          this.sfx('deny');
          this.snapCardBack(visual);
          return;
        }
      }

      // Otherwise snap back smoothly
      this.snapCardBack(visual);
    });
  }

  private isPointInsideAirlock(x: number, y: number): boolean {
    return x >= 14 && x <= 212 && y >= 705 && y <= 795;
  }

  private snapCardBack(visual: CardVisual): void {
    if (!visual.container.active) return;
    const check = this.engine.canPlayCard(visual.card.instanceId);
    this.drawCardFrame(visual.bgGraphics, visual.card, check.playable, false);
    this.tweens.killTweensOf(visual.container);
    this.tweens.add({
      targets: visual.container,
      x: visual.homeX,
      y: visual.homeY,
      scaleX: 1,
      scaleY: 1,
      angle: visual.homeAngle,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (visual.container.active) visual.container.setDepth(visual.baseDepth);
      },
    });
  }

  /** Shake/recoil a ship container around a fixed home X so overlapping tweens never drift. */
  private jolt(target: Phaser.GameObjects.Container, homeX: number, offset: number, repeat: number): void {
    this.tweens.killTweensOf(target);
    target.x = homeX;
    this.tweens.add({
      targets: target,
      x: homeX + offset,
      duration: 65,
      yoyo: true,
      repeat,
      onComplete: () => {
        target.x = homeX;
      },
    });
  }

  /** Procedural WebAudio synthesizer with Sape' pentatonic lute plucks and Gendang drum resonance. */
  private sfx(kind: 'pickup' | 'play' | 'hit' | 'deny' | 'airlock' | 'alarm' | 'win' | 'lose' | 'laser' | 'shield'): void {
    const sound = this.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = sound.context;
    if (!ctx || sound.locked) return;

    if (kind === 'play') {
      // Sape' pentatonic lute pluck (C4, D4, F4, G4, A4, C5)
      const pentatonic = [261.63, 293.66, 349.23, 392.0, 440.0, 523.25];
      const f = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
      return;
    }

    if (kind === 'win') {
      // Sape' victory chord arpeggio
      const notes = [261.63, 349.23, 392.0, 523.25];
      notes.forEach((f, idx) => {
        const t = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.62);
      });
      return;
    }

    if (kind === 'hit') {
      // Gendang hollow skin strike
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.26);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
      return;
    }

    if (kind === 'laser') {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      return;
    }

    if (kind === 'shield') {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.14);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
      return;
    }

    const presets: Record<string, { f0: number; f1: number; dur: number; type: OscillatorType; vol: number }> = {
      pickup: { f0: 520, f1: 700, dur: 0.06, type: 'triangle', vol: 0.05 },
      deny: { f0: 160, f1: 120, dur: 0.1, type: 'square', vol: 0.04 },
      airlock: { f0: 900, f1: 60, dur: 0.55, type: 'sawtooth', vol: 0.08 },
      alarm: { f0: 660, f1: 440, dur: 0.3, type: 'square', vol: 0.05 },
      lose: { f0: 300, f1: 40, dur: 0.8, type: 'sawtooth', vol: 0.07 },
    };
    const p = presets[kind];
    if (!p) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f0, t);
    osc.frequency.exponentialRampToValueAtTime(p.f1, t + p.dur);
    gain.gain.setValueAtTime(p.vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur + 0.02);
  }

  private setHandInteractive(enabled: boolean): void {
    for (const cv of this.cardVisuals) {
      if (!cv.container.active) continue;
      if (enabled) {
        cv.container.setInteractive({ draggable: true, useHandCursor: true });
      } else {
        cv.container.disableInteractive();
      }
    }
  }

  // =========================================================================
  // 7. CARD RESOLUTION, AIRLOCK JETTISON & ENEMY TURN ANIMATIONS
  // =========================================================================
  private executePlayCard(visual: CardVisual): void {
    const result = this.engine.playCard(visual.card.instanceId);
    if (!result.success) {
      this.snapCardBack(visual);
      return;
    }

    // Visual animations based on card effects
    const card = visual.card;
    this.sfx('play');

    if (card.damage && card.damage > 0) {
      const fromX = this.playerShipContainer.x + 45;
      const fromY = this.playerShipContainer.y + this.playerShipSprite.y;
      const toX = this.enemyShipContainer.x - 30;
      const toY = this.enemyShipContainer.y + this.enemyShipSprite.y;

      if (card.templateId === 'parang_snap') {
        this.playParangSnapVFX(fromX, fromY, toX, toY, result);
      } else if (card.templateId === 'sumpit_dart') {
        this.playSumpitDartVFX(fromX, fromY, toX, toY, result);
      } else if (card.templateId === 'rajang_whirlpool' || card.templateId === 'kenyalang_dive') {
        this.playRajangVolleyVFX(fromX, fromY, toX, toY, result);
      } else {
        this.playGenericAttackVFX(fromX, fromY, toX, toY, result);
      }
    }

    if (result.evasionGained > 0) {
      this.playShieldWardVFX(this.playerShipContainer);
      this.spawnFloatingText(
        this.playerShipContainer.x,
        this.playerShipContainer.y - 42,
        `+${result.evasionGained} EVASION`,
        '#38bdf8'
      );
    }

    if (result.hullRestored > 0) {
      this.spawnFloatingText(
        this.playerShipContainer.x,
        this.playerShipContainer.y - 20,
        `+${result.hullRestored} HULL`,
        '#4ade80'
      );
    }

    if (result.cancelledIntent) {
      this.spawnFloatingText(
        this.intentBoxContainer.x,
        this.intentBoxContainer.y,
        result.creditsSpent > 0 ? `INTENT JAMMED! (-${result.creditsSpent} Cr)` : 'INTENT JAMMED!',
        '#fde047'
      );
    }

    if (result.killedEnemy) {
      const isFinal = this.engine.getState().isCampaignComplete;
      const salvage = isFinal
        ? (this.engine.getState().contract.voided ? 50 : this.engine.getState().contract.payout + 50)
        : 35;
      this.spawnFloatingText(
        this.enemyShipContainer.x,
        this.enemyShipContainer.y - 12,
        isFinal ? `+${salvage} Cr BOUNTY & CONTRACT!` : `+${salvage} Cr SALVAGE!`,
        '#facc15'
      );
    }

    if (result.heatDelta < 0) {
      this.spawnFloatingText(
        225,
        145,
        `${result.heatDelta}% HEAT (VERA'S WHISPER)`,
        '#4ade80'
      );
    }

    this.refreshAllUI(true);
  }

  private executeJettisonCard(visual: CardVisual): void {
    const res = this.engine.jettisonCard(visual.card.instanceId);
    if (!res.success) {
      this.snapCardBack(visual);
      return;
    }

    // Airlock flash banner
    const flashOverlay = this.add.graphics();
    flashOverlay.fillStyle(0xef4444, 0.28);
    flashOverlay.fillRect(0, 0, 450, 800);
    flashOverlay.setDepth(120);
    this.tweens.add({
      targets: flashOverlay,
      alpha: 0,
      duration: 420,
      onComplete: () => flashOverlay.destroy(),
    });

    const banner = this.addText(225, 360, '☢️ AIRLOCK VENTED — CONTRACT VOIDED ☢️', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fef08a',
        backgroundColor: '#991b1bee',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(125);

    this.tweens.add({
      targets: banner,
      y: 325,
      alpha: 0,
      delay: 950,
      duration: 450,
      onComplete: () => banner.destroy(),
    });

    this.sfx('airlock');
    const cargo = this.engine.getState().contract;
    this.spawnFloatingText(110, 690, `JETTISONED ${visual.card.title.toUpperCase()} (0 AP)`, '#f87171');
    this.spawnFloatingText(225, 140, `-${cargo.payout} Cr CONTRACT FORFEITED`, '#fca5a5');
    this.refreshAllUI(true);
  }

  private handleEndTurnClicked(): void {
    this.isResolvingTurn = true;
    this.setHandInteractive(false);
    const result = this.engine.endTurn();

    // 1. Show contraband penalty if any Hot Stims were left in hand
    if (result.contrabandHeatAdded > 0) {
      this.sfx('alarm');
      this.spawnFloatingText(
        225,
        220,
        `⚠️ CONTRABAND IN HAND: +${result.contrabandHeatAdded}% HEAT!`,
        '#ef4444'
      );
    }

    // 2. Animate Enemy Intent execution
    const intent = result.enemyIntentExecuted;
    if (intent.cancelled) {
      this.spawnFloatingText(
        this.enemyShipContainer.x,
        this.enemyShipContainer.y - 35,
        'INTENT JAMMED — SKIPPED',
        '#94a3b8'
      );
    } else if (result.outcome !== 'DEFEAT_HEAT' || result.enemyHeatAdded > 0) {
      if (intent.id === 'CARGO_SCAN') {
        this.sfx('alarm');
        this.playCargoScanVFX(this.playerShipContainer);
        this.spawnFloatingText(
          this.playerShipContainer.x,
          this.playerShipContainer.y - 45,
          `⚠️ SCANNED: +${result.enemyHeatAdded}% HEAT!`,
          '#facc15'
        );
      } else if (intent.id === 'WARNING_SHOT' || intent.id === 'BROADSIDE') {
        this.playEnemyCannonVFX(
          this.enemyShipContainer.x - 30,
          this.enemyShipContainer.y + this.enemyShipSprite.y,
          this.playerShipContainer.x + 35,
          this.playerShipContainer.y + this.playerShipSprite.y,
          intent.id === 'BROADSIDE',
          result
        );
      } else if (intent.id === 'REINFORCE_HULL') {
        this.playShieldWardVFX(this.enemyShipContainer);
        this.spawnFloatingText(
          this.enemyShipContainer.x,
          this.enemyShipContainer.y - 35,
          `+${result.enemyShieldGained} SHIELD`,
          '#38bdf8'
        );
      }
    }

    this.time.delayedCall(420, () => {
      this.isResolvingTurn = false;
      this.refreshAllUI(true);
    });
  }

  private playParangSnapVFX(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    result: any
  ): void {
    // Crescent glowing plasma blade flying with angular spin
    const slash = this.add.image(fromX, fromY, 'fx_slash_arc').setScale(1.2).setDepth(60);
    slash.setTint(0xfacc15);

    // Muzzle plasma flare
    const flare = this.add.image(fromX, fromY, 'fx_plasma_flare').setScale(0.9).setDepth(61);
    this.tweens.add({
      targets: flare,
      scale: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => flare.destroy(),
    });

    this.tweens.add({
      targets: slash,
      x: toX,
      y: toY,
      angle: 360,
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: () => {
        slash.destroy();

        // High-intensity diagonal slash beam cut
        const sliceLine = this.add.graphics();
        sliceLine.lineStyle(4, 0xffffff, 1);
        sliceLine.lineBetween(toX - 28, toY - 26, toX + 28, toY + 26);
        sliceLine.lineStyle(2, 0xf59e0b, 0.9);
        sliceLine.lineBetween(toX - 38, toY - 36, toX + 38, toY + 36);
        sliceLine.setDepth(65);
        this.tweens.add({
          targets: sliceLine,
          alpha: 0,
          duration: 180,
          onComplete: () => sliceLine.destroy(),
        });

        // Additive spark explosion
        this.combatSparkEmitter.explode(24, toX, toY);

        // Flash & shake enemy ship
        this.enemyShipSprite.setTintFill(0xffffff);
        this.time.delayedCall(80, () => this.enemyShipSprite.clearTint());
        this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 12, 1);
        this.cameras.main.shake(140, 0.005);
        this.sfx('hit');

        if (result.damageToShield > 0) {
          this.spawnFloatingText(
            this.enemyShipContainer.x,
            this.enemyShipContainer.y - 45,
            `-${result.damageToShield} SHIELD`,
            '#38bdf8'
          );
        }
        if (result.damageToHull > 0) {
          this.spawnFloatingText(
            this.enemyShipContainer.x,
            this.enemyShipContainer.y - 22,
            `-${result.damageToHull} HULL`,
            '#ef4444'
          );
        }
      },
    });

    // Recoil player ship
    this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -10, 0);
  }

  private playSumpitDartVFX(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    result: any
  ): void {
    const bolt = this.add.image(fromX, fromY, 'fx_laser_bolt').setDepth(60);
    bolt.setTint(0x4ade80);

    this.tweens.add({
      targets: bolt,
      x: toX,
      y: toY,
      duration: 110,
      ease: 'Linear',
      onComplete: () => {
        bolt.destroy();

        // Concentric piercing shockwave ring
        const shock = this.add.image(toX, toY, 'fx_shockwave').setScale(0.3).setAlpha(1).setDepth(65);
        shock.setTint(0x4ade80);
        this.tweens.add({
          targets: shock,
          scale: 1.4,
          alpha: 0,
          duration: 220,
          onComplete: () => shock.destroy(),
        });

        this.combatSparkEmitter.explode(18, toX, toY);
        this.enemyShipSprite.setTintFill(0x86efac);
        this.time.delayedCall(80, () => this.enemyShipSprite.clearTint());
        this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 8, 1);
        this.sfx('hit');

        if (result.damageToHull > 0) {
          this.spawnFloatingText(
            this.enemyShipContainer.x,
            this.enemyShipContainer.y - 22,
            `-${result.damageToHull} HULL (PIERCED)`,
            '#4ade80'
          );
        }
      },
    });

    this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -6, 0);
  }

  private playRajangVolleyVFX(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    result: any
  ): void {
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 70, () => {
        const bolt = this.add.image(fromX, fromY + (i - 1) * 7, 'fx_laser_bolt').setDepth(60);
        bolt.setTint(0xef4444);
        this.sfx('laser');
        this.tweens.add({
          targets: bolt,
          x: toX,
          y: toY + (i - 1) * 5,
          duration: 110,
          onComplete: () => {
            bolt.destroy();
            this.combatSparkEmitter.explode(12, toX, toY);
            this.enemyShipSprite.setTintFill(0xffffff);
            this.time.delayedCall(45, () => this.enemyShipSprite.clearTint());
            this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 5, 1);
            if (i === 2) {
              this.sfx('hit');
              if (result.damageToShield > 0) {
                this.spawnFloatingText(
                  this.enemyShipContainer.x,
                  this.enemyShipContainer.y - 45,
                  `-${result.damageToShield} SHIELD`,
                  '#38bdf8'
                );
              }
              if (result.damageToHull > 0) {
                this.spawnFloatingText(
                  this.enemyShipContainer.x,
                  this.enemyShipContainer.y - 22,
                  `-${result.damageToHull} HULL`,
                  '#ef4444'
                );
              }
            }
          },
        });
      });
    }
    this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -10, 0);
  }

  private playGenericAttackVFX(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    result: any
  ): void {
    const beam = this.add.graphics();
    beam.lineStyle(4, 0xf97316, 0.95);
    beam.lineBetween(fromX, fromY, toX, toY);
    beam.setDepth(50);
    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 160,
      onComplete: () => beam.destroy(),
    });

    this.combatSparkEmitter.explode(18, toX, toY);
    this.enemyShipSprite.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.enemyShipSprite.clearTint());
    this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 10, 1);
    this.sfx('hit');

    if (result.damageToShield > 0) {
      this.spawnFloatingText(
        this.enemyShipContainer.x,
        this.enemyShipContainer.y - 45,
        `-${result.damageToShield} SHIELD`,
        '#38bdf8'
      );
    }
    if (result.damageToHull > 0) {
      this.spawnFloatingText(
        this.enemyShipContainer.x,
        this.enemyShipContainer.y - 22,
        `-${result.damageToHull} HULL`,
        '#ef4444'
      );
    }
  }

  private playShieldWardVFX(container: Phaser.GameObjects.Container): void {
    const ward = this.add.image(container.x, container.y, 'fx_shockwave').setScale(0.5).setDepth(55);
    ward.setTint(0x38bdf8);
    this.tweens.add({
      targets: ward,
      scale: 1.6,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => ward.destroy(),
    });
    this.combatSparkEmitter.explode(14, container.x, container.y);
  }

  private playEnemyCannonVFX(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    isBroadside: boolean,
    result: any
  ): void {
    // Muzzle smoke puff at enemy
    const smoke = this.add.image(fromX, fromY, 'fx_smoke').setScale(0.5).setDepth(45);
    this.tweens.add({
      targets: smoke,
      scale: 1.4,
      alpha: 0,
      duration: 280,
      onComplete: () => smoke.destroy(),
    });

    // Cannon shell
    const shell = this.add.image(fromX, fromY, 'fx_plasma_flare').setScale(isBroadside ? 1.3 : 0.95).setDepth(60);
    shell.setTint(isBroadside ? 0xef4444 : 0x38bdf8);

    this.tweens.add({
      targets: shell,
      x: toX,
      y: toY,
      duration: 170,
      ease: 'Quad.easeIn',
      onComplete: () => {
        shell.destroy();

        if (result.damageAbsorbedByEvasion > 0) {
          // Deflected by player Terabai shield!
          const ripple = this.add.image(toX, toY, 'fx_shockwave').setScale(0.6).setDepth(65);
          ripple.setTint(0x38bdf8);
          this.tweens.add({
            targets: ripple,
            scale: 1.5,
            alpha: 0,
            duration: 250,
            onComplete: () => ripple.destroy(),
          });
          this.combatSparkEmitter.explode(16, toX, toY);
          this.sfx('shield');
          this.spawnFloatingText(
            this.playerShipContainer.x,
            this.playerShipContainer.y - 52,
            `EVADED ${result.damageAbsorbedByEvasion} DMG`,
            '#38bdf8'
          );
        }

        if (result.hullDamageTaken > 0) {
          // Impact on Hull!
          this.combatSparkEmitter.explode(isBroadside ? 28 : 18, toX, toY);
          this.playerShipSprite.setTintFill(0xef4444);
          this.time.delayedCall(120, () => this.playerShipSprite.clearTint());
          this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -16, 2);
          this.cameras.main.shake(150, isBroadside ? 0.008 : 0.004);
          this.sfx('hit');
          this.spawnFloatingText(
            this.playerShipContainer.x,
            this.playerShipContainer.y - 25,
            `-${result.hullDamageTaken} HULL`,
            '#ef4444'
          );
        }
      },
    });
  }

  private playCargoScanVFX(targetContainer: Phaser.GameObjects.Container): void {
    const scanLine = this.add.graphics();
    scanLine.setDepth(65);
    const leftX = targetContainer.x - 42;
    const rightX = targetContainer.x + 42;
    const topY = targetContainer.y - 32;
    const botY = targetContainer.y + 32;

    const scanObj = { progress: 0 };
    this.tweens.add({
      targets: scanObj,
      progress: 1,
      duration: 420,
      ease: 'Linear',
      onUpdate: () => {
        scanLine.clear();
        const currentX = Phaser.Math.Linear(leftX, rightX, scanObj.progress);
        scanLine.lineStyle(3, 0xfacc15, 0.95);
        scanLine.lineBetween(currentX, topY, currentX, botY);
        scanLine.lineStyle(1.5, 0xffffff, 1);
        scanLine.lineBetween(currentX, topY, currentX, botY);
        scanLine.fillStyle(0xeab308, 0.12);
        scanLine.fillRect(leftX, topY, Math.max(1, currentX - leftX), botY - topY);
      },
      onComplete: () => {
        scanLine.destroy();
      },
    });
  }



  private spawnFloatingText(x: number, y: number, message: string, colorHex: string): void {
    const txt = this.addText(Phaser.Math.Clamp(x, 0, 450), y, message, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: colorHex,
        stroke: '#090d18',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(110);
    // Keep the whole label on-screen
    const half = Math.min(txt.width / 2 + 6, 225);
    txt.x = Phaser.Math.Clamp(txt.x, half, 450 - half);

    txt.setScale(0.7);
    this.tweens.add({
      targets: txt,
      scale: 1.15,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: txt,
      y: y - 34,
      alpha: 0,
      duration: 1050,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  // =========================================================================
  // 8. END-OF-ENCOUNTER & SECTOR MODALS (VICTORY, MARKET, DEFEAT)
  // =========================================================================
  private showOutcomeModal(state: CombatState): void {
    this.outcomeModalTimer = undefined;
    if (state.outcome === 'ONGOING') return;
    if (this.modalContainer) {
      this.modalContainer.destroy();
      this.modalContainer = undefined;
    }
    this.setHandInteractive(false);
    this.sfx(state.outcome === 'VICTORY' ? 'win' : 'lose');
    this.updateTopHud(state);

    this.modalContainer = this.add.container(0, 0).setDepth(200);

    const backdrop = this.add
      .rectangle(225, 400, 450, 800, 0x050811, 0.88)
      .setInteractive();
    this.modalContainer.add(backdrop);

    const isVictory = state.outcome === 'VICTORY';
    if (isVictory && !state.isCampaignComplete) {
      this.renderBlackMarketModal(state);
    } else if (isVictory && state.isCampaignComplete) {
      this.renderCampaignVictoryModal(state);
    } else {
      this.renderDefeatModal(state);
    }
  }

  private renderBlackMarketModal(state: CombatState): void {
    if (!this.modalContainer) return;

    // Outpost panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1120, 0.98);
    panel.fillRoundedRect(18, 55, 414, 690, 14);
    panel.lineStyle(2.5, 0xeab308, 1);
    panel.strokeRoundedRect(18, 55, 414, 690, 14);
    this.modalContainer.add(panel);

    const titleText = this.addText(225, 84, `★ SECTOR ${state.sector.number} CLEARED ★`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fef08a',
      align: 'center',
    }).setOrigin(0.5);

    const subText = this.addText(
      225,
      106,
      `${state.sector.name.toUpperCase()} PATROL EVADED • WATERFRONT DOCK`,
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '10.5px',
        color: '#94a3b8',
        align: 'center',
      }
    ).setOrigin(0.5);

    this.modalContainer.add([titleText, subText]);

    // Dynamic market content sub-container (redraws upon buying items)
    const marketContent = this.add.container(0, 0);
    this.modalContainer.add(marketContent);

    const redrawMarketContent = () => {
      marketContent.removeAll(true);
      const s = this.engine.getState();
      this.updateTopHud(s);

      // Telemetry Bar at y = 124..156
      const barGfx = this.add.graphics();
      barGfx.fillStyle(0x1e293b, 0.95);
      barGfx.fillRoundedRect(30, 124, 390, 32, 6);
      barGfx.lineStyle(1.5, 0x475569, 1);
      barGfx.strokeRoundedRect(30, 124, 390, 32, 6);
      const teleText = this.addText(
        225,
        140,
        `HULL ${s.player.hull}/${s.player.maxHull}  •  FUEL ${s.player.fuel}  •  CR ${s.player.credits}  •  HEAT ${s.player.heat}%`,
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fde68a',
        }
      ).setOrigin(0.5);
      marketContent.add([barGfx, teleText]);

      // Market Section Banner at y = 172
      const invHeader = this.addText(225, 172, '── WATERFRONT BLACK MARKET ──', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#d97724',
      }).setOrigin(0.5);
      marketContent.add(invHeader);

      // Market Items
      const items = s.availableMarketItems;
      const startY = 194;
      const rowHeight = 72;
      const gap = 8;

      items.forEach((item, idx) => {
        const itemY = startY + idx * (rowHeight + gap);
        const canAfford = s.player.credits >= item.cost;
        const rowGfx = this.add.graphics();
        rowGfx.fillStyle(0x131d31, 0.95);
        rowGfx.fillRoundedRect(30, itemY, 390, rowHeight, 8);
        rowGfx.lineStyle(1.5, canAfford ? 0x0284c7 : 0x334155, 1);
        rowGfx.strokeRoundedRect(30, itemY, 390, rowHeight, 8);

        let icon = '🔧';
        if (item.type === 'cool') icon = '❄️';
        else if (item.type === 'fuel') icon = '⛽';
        else if (item.type === 'card') icon = '⭐';

        const nameTxt = this.addText(42, itemY + 12, `${icon} ${item.name}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#fef08a',
        });
        const costTxt = this.addText(305, itemY + 12, `${item.cost} Cr`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '11.5px',
          fontStyle: 'bold',
          color: canAfford ? '#facc15' : '#94a3b8',
        });
        const descTxt = this.addText(42, itemY + 34, item.description, {
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          color: '#cbd5e1',
          wordWrap: { width: 250 },
        });

        // Buy Button
        const btnGfx = this.add.graphics();
        const btnX = 302;
        const btnY = itemY + 34;
        const btnW = 104;
        const btnH = 28;
        const drawBtn = (hover: boolean) => {
          btnGfx.clear();
          if (canAfford) {
            btnGfx.fillStyle(hover ? 0xfacc15 : 0xd97724, 1);
            btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
            btnGfx.lineStyle(1.5, 0xfef08a, 1);
            btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
          } else {
            btnGfx.fillStyle(0x1e293b, 1);
            btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
            btnGfx.lineStyle(1.5, 0x475569, 1);
            btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
          }
        };
        drawBtn(false);

        const btnLabel = this.addText(
          btnX + btnW / 2,
          btnY + btnH / 2,
          canAfford ? 'BUY ▶' : 'LOCKED',
          {
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: canAfford ? '#0f172a' : '#64748b',
          }
        ).setOrigin(0.5);

        const btnZone = this.add
          .zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: canAfford });

        if (canAfford) {
          btnZone.on('pointerover', () => drawBtn(true));
          btnZone.on('pointerout', () => drawBtn(false));
          btnZone.on('pointerdown', () => {
            const res = this.engine.buyBlackMarketItem(item.id);
            if (res.success) {
              this.sfx('play');
              this.spawnFloatingText(225, itemY + 30, res.message, '#4ade80');
              redrawMarketContent();
            } else {
              this.sfx('deny');
              this.spawnFloatingText(225, itemY + 30, res.reason || 'Cannot buy', '#ef4444');
            }
          });
        }

        marketContent.add([rowGfx, nameTxt, costTxt, descTxt, btnGfx, btnLabel, btnZone]);
      });

      if (items.length === 0) {
        const emptyTxt = this.addText(
          225,
          300,
          '── All black market supplies purchased for this sector ──',
          {
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            color: '#64748b',
          }
        ).setOrigin(0.5);
        marketContent.add(emptyTxt);
      }

      // Bottom Jump Button at y = 664
      const jumpBtnGfx = this.add.graphics();
      const jumpW = 380;
      const jumpH = 54;
      const jumpX = 35;
      const jumpY = 664;
      const hasFuel = s.player.fuel > 0;
      const nextSector = s.sector.number + 1;

      const drawJumpBtn = (hover: boolean) => {
        jumpBtnGfx.clear();
        if (hasFuel) {
          jumpBtnGfx.fillStyle(hover ? 0x0284c7 : 0x0369a1, 1);
          jumpBtnGfx.fillRoundedRect(jumpX, jumpY, jumpW, jumpH, 10);
          jumpBtnGfx.lineStyle(2.5, hover ? 0x7dd3fc : 0x38bdf8, 1);
          jumpBtnGfx.strokeRoundedRect(jumpX, jumpY, jumpW, jumpH, 10);
        } else {
          jumpBtnGfx.fillStyle(0x334155, 1);
          jumpBtnGfx.fillRoundedRect(jumpX, jumpY, jumpW, jumpH, 10);
          jumpBtnGfx.lineStyle(2, 0xef4444, 1);
          jumpBtnGfx.strokeRoundedRect(jumpX, jumpY, jumpW, jumpH, 10);
        }
      };
      drawJumpBtn(false);

      const jumpLabel = this.addText(
        225,
        jumpY + jumpH / 2,
        hasFuel ? `JUMP TO SECTOR ${nextSector} (-1 FUEL) ▶` : '⚠️ OUT OF FUEL (REFUEL ABOVE)',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: hasFuel ? '#f8fafc' : '#fca5a5',
        }
      ).setOrigin(0.5);

      const jumpZone = this.add
        .zone(225, jumpY + jumpH / 2, jumpW, jumpH)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      jumpZone.on('pointerover', () => drawJumpBtn(true));
      jumpZone.on('pointerout', () => drawJumpBtn(false));
      jumpZone.on('pointerdown', () => {
        if (!hasFuel) {
          this.sfx('deny');
          this.spawnFloatingText(225, jumpY - 15, '⚠️ OUT OF FUEL — PURCHASE FUEL FIRST!', '#ef4444');
          return;
        }
        const advanceRes = this.engine.advanceToNextSector();
        if (advanceRes.success) {
          if (this.modalContainer) {
            this.modalContainer.destroy();
            this.modalContainer = undefined;
          }
          this.cancelPendingModal();
          this.isResolvingTurn = false;
          this.sfx('play');
          this.cameras.main.flash(280, 56, 189, 248);
          this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, 0, 0);
          this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 0, 0);
          this.refreshAllUI(true);
        } else {
          this.sfx('deny');
          this.spawnFloatingText(225, jumpY - 15, advanceRes.reason || 'Cannot advance', '#ef4444');
        }
      });

      marketContent.add([jumpBtnGfx, jumpLabel, jumpZone]);
    };

    redrawMarketContent();
  }

  private renderCampaignVictoryModal(state: CombatState): void {
    if (!this.modalContainer) return;
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1120, 0.98);
    panel.fillRoundedRect(24, 130, 402, 530, 14);
    panel.lineStyle(3, 0xeab308, 1);
    panel.strokeRoundedRect(24, 130, 402, 530, 14);
    this.modalContainer.add(panel);

    const titleText = this.addText(225, 172, '👑 BEJALAI LEGEND ACHIEVED 👑', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15.5px',
      fontStyle: 'bold',
      color: '#fef08a',
      align: 'center',
    }).setOrigin(0.5);

    const subText = this.addText(
      225,
      204,
      'Brooke Flagship dismantled! Sarawak Corridor liberated!',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#cbd5e1',
        align: 'center',
        wordWrap: { width: 360 },
      }
    ).setOrigin(0.5);

    const payoutStatus = state.contract.voided
      ? '0 Cr (Cargo Jettisoned)'
      : `+${state.contract.payout} Cr (${state.contract.name})`;

    const statsBlock = [
      `EXPEDITION OUTCOME : ALL 3 SECTORS CONQUERED`,
      `FINAL HULL         : ${state.player.hull} / ${state.player.maxHull}`,
      `FINAL HEAT         : ${state.player.heat}% / ${state.player.maxHeat}%`,
      `FUEL RESERVES      : ${state.player.fuel} Cells`,
      `CONTRACT STATUS    : ${payoutStatus}`,
      `TOTAL CREDITS      : ${state.player.credits} Cr`,
      `TURNS IN RUN       : ${state.turn}`,
    ].join('\n\n');

    const statsBox = this.add.graphics();
    statsBox.fillStyle(0x131d31, 0.95);
    statsBox.fillRoundedRect(38, 236, 374, 280, 8);
    statsBox.lineStyle(1.5, 0x475569, 1);
    statsBox.strokeRoundedRect(38, 236, 374, 280, 8);

    const statsText = this.addText(54, 252, statsBlock, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11.5px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0, 0);

    const btnBg = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xfacc15 : 0xd97724, 1);
      btnBg.fillRoundedRect(50, 546, 350, 56, 10);
      btnBg.lineStyle(2.5, 0xfef08a, 1);
      btnBg.strokeRoundedRect(50, 546, 350, 56, 10);
    };
    drawBtn(false);

    const btnLabel = this.addText(225, 574, 'START NEW BEJALAI EXPEDITION ↻', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#0f172a',
    }).setOrigin(0.5);

    const btnZone = this.add
      .zone(225, 574, 350, 56)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => drawBtn(true));
    btnZone.on('pointerout', () => drawBtn(false));
    btnZone.on('pointerdown', () => {
      if (this.modalContainer) {
        this.modalContainer.destroy();
        this.modalContainer = undefined;
      }
      this.cancelPendingModal();
      this.isResolvingTurn = false;
      this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, 0, 0);
      this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 0, 0);
      this.engine.resetCampaign();
      this.refreshAllUI(true);
    });

    this.modalContainer.add([panel, titleText, subText, statsBox, statsText, btnBg, btnLabel, btnZone]);
  }

  private renderDefeatModal(state: CombatState): void {
    if (!this.modalContainer) return;
    const borderCol = 0xef4444;
    const headerTitle =
      state.outcome === 'DEFEAT_HEAT'
        ? '🚨 IMPOUNDED BY CUSTOMS (100% HEAT) 🚨'
        : '💥 FREIGHTER HULL DESTROYED 💥';

    const subtitle =
      state.outcome === 'DEFEAT_HEAT'
        ? `Magnetic clamps secured in Sector ${state.sector.number}: ${state.sector.name}. Cargo impounded.`
        : `Critical reactor breach in Sector ${state.sector.number}: ${state.sector.name}.`;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1120, 0.98);
    panel.fillRoundedRect(24, 150, 402, 490, 14);
    panel.lineStyle(3, borderCol, 1);
    panel.strokeRoundedRect(24, 150, 402, 490, 14);
    this.modalContainer.add(panel);

    const titleText = this.addText(225, 194, headerTitle, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14.5px',
      fontStyle: 'bold',
      color: '#fca5a5',
      align: 'center',
      wordWrap: { width: 360 },
    }).setOrigin(0.5);

    const subText = this.addText(225, 230, subtitle, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: 350 },
    }).setOrigin(0.5);

    const statsBlock = [
      `SECTOR REACHED   : ${state.sector.number} / ${state.sector.maxSectors} (${state.sector.name})`,
      `ENEMY OPPONENT   : ${state.enemy.name}`,
      `REMAINING HULL   : ${state.player.hull} / ${state.player.maxHull}`,
      `FINAL HEAT       : ${state.player.heat}% / ${state.player.maxHeat}%`,
      `CREDITS RECOVERED: ${state.player.credits} Cr`,
      `TURNS SURVIVED   : ${state.turn}`,
    ].join('\n\n');

    const statsBox = this.add.graphics();
    statsBox.fillStyle(0x131d31, 0.95);
    statsBox.fillRoundedRect(38, 260, 374, 240, 8);
    statsBox.lineStyle(1.5, 0xef4444, 0.6);
    statsBox.strokeRoundedRect(38, 260, 374, 240, 8);

    const statsText = this.addText(54, 276, statsBlock, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0, 0);

    const btnBg = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xf87171 : 0xd97724, 1);
      btnBg.fillRoundedRect(50, 528, 350, 56, 10);
      btnBg.lineStyle(2.5, 0xfca5a5, 1);
      btnBg.strokeRoundedRect(50, 528, 350, 56, 10);
    };
    drawBtn(false);

    const btnLabel = this.addText(225, 556, 'RETRY BEJALAI EXPEDITION ↻', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14.5px',
      fontStyle: 'bold',
      color: '#0f172a',
    }).setOrigin(0.5);

    const btnZone = this.add
      .zone(225, 556, 350, 56)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => drawBtn(true));
    btnZone.on('pointerout', () => drawBtn(false));
    btnZone.on('pointerdown', () => {
      if (this.modalContainer) {
        this.modalContainer.destroy();
        this.modalContainer = undefined;
      }
      this.cancelPendingModal();
      this.isResolvingTurn = false;
      this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, 0, 0);
      this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 0, 0);
      this.engine.resetCampaign();
      this.refreshAllUI(true);
    });

    this.modalContainer.add([panel, titleText, subText, statsBox, statsText, btnBg, btnLabel, btnZone]);
  }
  private addText(
    x: number,
    y: number,
    text: string | string[],
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): Phaser.GameObjects.Text {
    const fontStack = '"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace';
    return this.make.text({
      x,
      y,
      text,
      style: {
      ...style,
      fontFamily: style.fontFamily ? `${style.fontFamily}, ${fontStack}` : fontStack,
      resolution: DPR,
      }
    }, true);
  }
}
