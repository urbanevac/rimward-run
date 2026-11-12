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
  private hullPillText!: Phaser.GameObjects.Text;
  private hullPillBg!: Phaser.GameObjects.Graphics;
  private fuelPillText!: Phaser.GameObjects.Text;
  private crPillText!: Phaser.GameObjects.Text;
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

    this.refreshAllUI(true);
  }

  public update(_time: number, delta: number): void {
    if (this.starsFar && this.starsNear) {
      this.starsFar.tilePositionX += delta * 0.008;
      this.starsNear.tilePositionX += delta * 0.022;
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
    this.addText(14, 8, 'RIMWARD RUN // SECTOR 04-B', {
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

    // Subtle engine hover tween
    this.playerShipSprite = this.add.image(0, 0, 'ship_player').setScale(0.5);
    this.playerShipContainer.add(this.playerShipSprite);

    const playerLabel = this.addText(0, 52, 'SS DUSTRUNNER (SMUGGLER)', {
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
    evBg.fillStyle(0x0c4a6e, 0.92);
    evBg.fillRoundedRect(-58, -14, 116, 28, 6);
    evBg.lineStyle(1.5, 0x38bdf8, 1);
    evBg.strokeRoundedRect(-58, -14, 116, 28, 6);
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

    // --- RIGHT: Alliance Customs Cutter ---
    this.enemyShipContainer = this.add.container(336, 298);
    this.enemyShipSprite = this.add.image(0, 0, 'ship_enemy').setScale(0.5);
    this.enemyShipContainer.add(this.enemyShipSprite);

    const enemyNameLabel = this.addText(0, 46, 'ALLIANCE CUSTOMS CUTTER', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);
    this.enemyShipContainer.add(enemyNameLabel);

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
    this.apOrbText.setText(`⚡ AP: ${state.player.ap}/${state.player.maxAp}`);
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
        `📦 CONTRACT: ${state.contract.name} — PAYOUT: ${state.contract.payout} Cr`
      );
      this.contractBadgeText.setColor('#fde68a');
    } else {
      this.contractBadgeBg.fillStyle(0x3b1219, 0.95);
      this.contractBadgeBg.fillRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeBg.lineStyle(1.5, 0xef4444, 0.95);
      this.contractBadgeBg.strokeRoundedRect(12, 72, 426, 34, 7);
      this.contractBadgeText.setText(
        `⚠️ CONTRACT: ${state.contract.name} — [JETTISONED / 0 Cr]`
      );
      this.contractBadgeText.setColor('#fca5a5');
    }
  }

  private updateShipsAndIntent(state: CombatState): void {
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
        return { stripe: 0xd97724, border: 0xf97316, badgeText: '#fed7aa' };
      case 'Pilot':
        return { stripe: 0x0284c7, border: 0x38bdf8, badgeText: '#bae6fd' };
      case 'Mechanic':
        return { stripe: 0x16a34a, border: 0x4ade80, badgeText: '#bbf7d0' };
      case 'Captain':
        return { stripe: 0xca8a04, border: 0xeab308, badgeText: '#fef08a' };
      case 'Contraband':
        return { stripe: 0xdc2626, border: 0xef4444, badgeText: '#fecaca' };
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
    const roleColors = this.getRoleColors(card.type);
    const isContraband = card.type === 'Contraband';

    gfx.clear();

    // Card body background
    const bodyFill = isContraband ? 0x2c0b0e : 0x1e293b;
    gfx.fillStyle(bodyFill, 0.98);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    // Role color stripe across top
    gfx.fillStyle(roleColors.stripe, 0.9);
    gfx.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, 26, { tl: 6, tr: 6, bl: 0, br: 0 });

    // Inner artwork frame
    gfx.fillStyle(0x0f172a, 0.85);
    gfx.fillRoundedRect(-w / 2 + 8, -22, w - 16, 36, 5);

    // Border stroke
    const borderCol = highlighted
      ? 0xfef08a
      : isContraband
      ? 0xef4444
      : playable
      ? roleColors.border
      : 0x475569;
    const borderThickness = highlighted ? 2.8 : playable || isContraband ? 2 : 1.5;
    gfx.lineStyle(borderThickness, borderCol, 1);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
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

  /** Tiny procedural WebAudio blips — zero audio assets. */
  private sfx(kind: 'pickup' | 'play' | 'hit' | 'deny' | 'airlock' | 'alarm' | 'win' | 'lose'): void {
    const sound = this.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = sound.context;
    if (!ctx || sound.locked) return;
    const presets: Record<typeof kind, { f0: number; f1: number; dur: number; type: OscillatorType; vol: number }> = {
      pickup: { f0: 520, f1: 700, dur: 0.06, type: 'triangle', vol: 0.05 },
      play: { f0: 300, f1: 900, dur: 0.12, type: 'square', vol: 0.05 },
      hit: { f0: 180, f1: 50, dur: 0.22, type: 'sawtooth', vol: 0.08 },
      deny: { f0: 160, f1: 120, dur: 0.1, type: 'square', vol: 0.04 },
      airlock: { f0: 900, f1: 60, dur: 0.55, type: 'sawtooth', vol: 0.08 },
      alarm: { f0: 660, f1: 440, dur: 0.3, type: 'square', vol: 0.05 },
      win: { f0: 440, f1: 1320, dur: 0.6, type: 'triangle', vol: 0.07 },
      lose: { f0: 300, f1: 40, dur: 0.8, type: 'sawtooth', vol: 0.07 },
    };
    const p = presets[kind];
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
      this.fireProjectileEffect(
        this.playerShipContainer.x + 55,
        this.playerShipContainer.y,
        this.enemyShipContainer.x - 45,
        this.enemyShipContainer.y,
        0xf97316
      );

      // Recoil player ship
      this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -10, 0);

      // Flash & shake enemy ship
      this.enemyShipSprite.setTintFill(0xffffff);
      this.time.delayedCall(110, () => this.enemyShipSprite.clearTint());
      this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 12, 1);
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

    if (result.evasionGained > 0) {
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
        'INTENT JAMMED! (-15 Cr)',
        '#fde047'
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
        this.fireProjectileEffect(
          CombatScene.ENEMY_HOME_X - 50,
          this.enemyShipContainer.y,
          CombatScene.PLAYER_HOME_X + 40,
          this.playerShipContainer.y,
          0xeab308
        );
        this.spawnFloatingText(
          this.playerShipContainer.x,
          this.playerShipContainer.y - 45,
          `⚠️ SCANNED: +${result.enemyHeatAdded}% HEAT!`,
          '#facc15'
        );
      } else if (intent.id === 'WARNING_SHOT' || intent.id === 'BROADSIDE') {
        this.fireProjectileEffect(
          this.enemyShipContainer.x - 50,
          this.enemyShipContainer.y,
          this.playerShipContainer.x + 40,
          this.playerShipContainer.y,
          0x38bdf8
        );
        this.playerShipSprite.setTintFill(0xef4444);
        this.time.delayedCall(130, () => this.playerShipSprite.clearTint());
        this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, -16, 2);
        this.cameras.main.shake(140, intent.id === 'BROADSIDE' ? 0.008 : 0.004);
        if (result.hullDamageTaken > 0) this.sfx('hit');

        if (result.damageAbsorbedByEvasion > 0) {
          this.spawnFloatingText(
            this.playerShipContainer.x,
            this.playerShipContainer.y - 52,
            `EVADED ${result.damageAbsorbedByEvasion} DMG`,
            '#38bdf8'
          );
        }
        if (result.hullDamageTaken > 0) {
          this.spawnFloatingText(
            this.playerShipContainer.x,
            this.playerShipContainer.y - 25,
            `-${result.hullDamageTaken} HULL`,
            '#ef4444'
          );
        }
      } else if (intent.id === 'REINFORCE_HULL') {
        this.spawnFloatingText(
          this.enemyShipContainer.x,
          this.enemyShipContainer.y - 35,
          `+${result.enemyShieldGained} SHIELD`,
          '#38bdf8'
        );
      }
    }

    this.time.delayedCall(260, () => {
      this.isResolvingTurn = false;
      this.refreshAllUI(true);
    });
  }

  private fireProjectileEffect(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number
  ): void {
    const beam = this.add.graphics();
    beam.lineStyle(4, color, 0.95);
    beam.lineBetween(fromX, fromY, toX, toY);
    beam.setDepth(50);

    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 220,
      onComplete: () => beam.destroy(),
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
  // 8. END-OF-ENCOUNTER MODAL OVERLAY (VICTORY / DEFEAT)
  // =========================================================================
  private showOutcomeModal(state: CombatState): void {
    this.outcomeModalTimer = undefined;
    if (state.outcome === 'ONGOING') return;
    if (this.modalContainer) {
      this.modalContainer.destroy();
    }
    this.setHandInteractive(false);
    this.sfx(state.outcome === 'VICTORY' ? 'win' : 'lose');

    this.modalContainer = this.add.container(0, 0).setDepth(200);

    const backdrop = this.add
      .rectangle(225, 400, 450, 800, 0x050811, 0.84)
      .setInteractive();
    this.modalContainer.add(backdrop);

    const isVictory = state.outcome === 'VICTORY';
    const borderCol = isVictory ? 0xeab308 : 0xef4444;
    const headerTitle = isVictory
      ? '★ BLOCKADE RUN SUCCESSFUL ★'
      : state.outcome === 'DEFEAT_HEAT'
      ? '🚨 BOARDED & IMPOUNDED (100% HEAT) 🚨'
      : '💥 SHIP HULL BREACHED 💥';

    const subtitle = isVictory
      ? 'Alliance Customs Cutter disabled. Jump drive spooled!'
      : state.outcome === 'DEFEAT_HEAT'
      ? 'Alliance customs locked magnetic clamps onto your vessel.'
      : 'Critical reactor failure in the Rimward sector.';

    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 0.98);
    panel.fillRoundedRect(32, 190, 386, 410, 14);
    panel.lineStyle(3, borderCol, 1);
    panel.strokeRoundedRect(32, 190, 386, 410, 14);
    this.modalContainer.add(panel);

    const titleText = this.addText(225, 236, headerTitle, {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: isVictory ? '#fef08a' : '#fca5a5',
        align: 'center',
        wordWrap: { width: 350 },
      })
      .setOrigin(0.5);

    const subText = this.addText(225, 272, subtitle, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11.5px',
        color: '#cbd5e1',
        align: 'center',
        wordWrap: { width: 340 },
      })
      .setOrigin(0.5);

    const payoutStatus = isVictory
      ? state.contract.voided
        ? '0 Cr (Cargo Jettisoned)'
        : `+${state.creditsEarnedThisRun} Cr (${state.contract.name})`
      : '0 Cr (Run Failed)';

    const statsBlock = [
      `REMAINING HULL : ${state.player.hull} / ${state.player.maxHull}`,
      `FINAL HEAT     : ${state.player.heat}% / ${state.player.maxHeat}%`,
      `CONTRACT PAYOUT: ${payoutStatus}`,
      `TOTAL CREDITS  : ${state.player.credits} Cr`,
      `TURNS ELAPSED  : ${state.turn}`,
    ].join('\n\n');

    const statsText = this.addText(64, 320, statsBlock, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12.5px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0, 0);

    // Replay / Play Next Encounter Button
    const btnBg = this.add.graphics();
    const drawReplayBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xfacc15 : 0xd97724, 1);
      btnBg.fillRoundedRect(75, 512, 300, 56, 10);
      btnBg.lineStyle(2.5, 0xfef08a, 1);
      btnBg.strokeRoundedRect(75, 512, 300, 56, 10);
    };
    drawReplayBtn(false);

    const btnLabel = this.addText(225, 540, 'PLAY NEXT ENCOUNTER ↻', {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#0f172a',
      })
      .setOrigin(0.5);

    const btnZone = this.add
      .zone(225, 540, 300, 56)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => drawReplayBtn(true));
    btnZone.on('pointerout', () => drawReplayBtn(false));
    btnZone.on('pointerdown', () => {
      if (this.modalContainer) {
        this.modalContainer.destroy();
        this.modalContainer = undefined;
      }
      this.cancelPendingModal();
      this.isResolvingTurn = false;
      this.jolt(this.playerShipContainer, CombatScene.PLAYER_HOME_X, 0, 0);
      this.jolt(this.enemyShipContainer, CombatScene.ENEMY_HOME_X, 0, 0);
      this.engine.resetEncounter();
      this.refreshAllUI(true);
    });

    this.modalContainer.add([titleText, subText, statsText, btnBg, btnLabel, btnZone]);
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
