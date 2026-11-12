import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  // Generate procedural textures at 2x resolution so they render razor-sharp on Retina / iPhone displays
  private static readonly TEXTURE_SCALE = 2;

  constructor() {
    super({ key: 'BootScene' });
  }

  public create(): void {
    this.generateStarfieldTextures();
    this.generateShipTextures();
    this.generateCardIcons();
    this.generateParticleTexture();

    this.scene.start('CombatScene');
  }

  private generateStarfieldTextures(): void {
    const s = BootScene.TEXTURE_SCALE;

    // Far starfield layer (450x320 logical -> 900x640 at 2x)
    const farGfx = this.make.graphics({ x: 0, y: 0 }, false);
    farGfx.setScale(s);
    farGfx.fillStyle(0x090e1a, 1);
    farGfx.fillRect(0, 0, 450, 320);

    // Nebula dust patches
    farGfx.fillStyle(0xd97724, 0.06);
    farGfx.fillCircle(110, 95, 85);
    farGfx.fillStyle(0x38bdf8, 0.05);
    farGfx.fillCircle(340, 120, 95);

    const rng = new Phaser.Math.RandomDataGenerator(['rimward-stars-far']);
    for (let i = 0; i < 85; i++) {
      const x = rng.between(2, 448);
      const y = rng.between(2, 310);
      const alpha = rng.realInRange(0.25, 0.75);
      const size = rng.pick([1, 1, 1.5, 2]);
      const color = rng.pick([0xf8fafc, 0xfde68a, 0xbae6fd]);
      farGfx.fillStyle(color, alpha);
      farGfx.fillCircle(x, y, size);
    }
    farGfx.generateTexture('bg_stars_far', 450 * s, 320 * s);
    farGfx.destroy();

    // Near starfield layer (transparent with brighter stars for parallax)
    const nearGfx = this.make.graphics({ x: 0, y: 0 }, false);
    nearGfx.setScale(s);
    const rngNear = new Phaser.Math.RandomDataGenerator(['rimward-stars-near']);
    for (let i = 0; i < 36; i++) {
      const x = rngNear.between(4, 446);
      const y = rngNear.between(4, 300);
      const color = rngNear.pick([0xffffff, 0xeab308, 0x38bdf8]);
      nearGfx.fillStyle(color, rngNear.realInRange(0.45, 0.95));
      nearGfx.fillCircle(x, y, rngNear.pick([1.2, 1.8, 2.2]));
    }
    nearGfx.generateTexture('bg_stars_near', 450 * s, 320 * s);
    nearGfx.destroy();
  }

  private generateShipTextures(): void {
    const s = BootScene.TEXTURE_SCALE;

    // Player Freighter Silhouette (Firefly-inspired asymmetrical smuggling freighter) - 160x96 logical
    const pGfx = this.make.graphics({ x: 0, y: 0 }, false);
    pGfx.setScale(s);

    // Thruster flare glow
    pGfx.fillStyle(0xeab308, 0.25);
    pGfx.fillCircle(24, 52, 20);
    pGfx.fillStyle(0xf59e0b, 0.75);
    pGfx.fillTriangle(4, 46, 28, 39, 28, 63);
    pGfx.fillStyle(0xfef08a, 0.95);
    pGfx.fillTriangle(11, 49, 28, 44, 28, 58);

    // Main Drive Pod & Rear Hull
    pGfx.fillStyle(0x475569, 1);
    pGfx.fillRoundedRect(24, 34, 48, 34, 6);
    pGfx.lineStyle(2, 0xd97724, 1);
    pGfx.strokeRoundedRect(24, 34, 48, 34, 6);

    // Mid-bulk cargobay spine
    pGfx.fillStyle(0x64748b, 1);
    pGfx.fillRect(66, 38, 44, 24);
    pGfx.fillStyle(0x9a3412, 0.9);
    pGfx.fillRect(72, 42, 32, 16);

    // Outrigger VTOL nacelle pod
    pGfx.fillStyle(0x334155, 1);
    pGfx.fillRoundedRect(52, 54, 42, 16, 4);
    pGfx.lineStyle(1.5, 0xeab308, 0.9);
    pGfx.strokeRoundedRect(52, 54, 42, 16, 4);

    // Forward swan-neck cockpit mandible
    pGfx.fillStyle(0xd97724, 1);
    pGfx.beginPath();
    pGfx.moveTo(106, 40);
    pGfx.lineTo(146, 46);
    pGfx.lineTo(152, 52);
    pGfx.lineTo(138, 58);
    pGfx.lineTo(106, 58);
    pGfx.closePath();
    pGfx.fillPath();
    pGfx.lineStyle(1.5, 0xfde68a, 0.8);
    pGfx.strokePath();

    // Canopy glass
    pGfx.fillStyle(0x38bdf8, 0.85);
    pGfx.beginPath();
    pGfx.moveTo(126, 45);
    pGfx.lineTo(145, 47);
    pGfx.lineTo(140, 52);
    pGfx.lineTo(124, 52);
    pGfx.closePath();
    pGfx.fillPath();

    // Dorsal antenna
    pGfx.lineStyle(1.5, 0xe2e8f0, 0.7);
    pGfx.lineBetween(82, 38, 74, 22);
    pGfx.lineBetween(96, 38, 92, 26);

    pGfx.generateTexture('ship_player', 160 * s, 96 * s);
    pGfx.destroy();

    // Enemy Alliance Customs Cutter (Sterile cyan/slate wedge interceptor facing left) - 168x96 logical
    const eGfx = this.make.graphics({ x: 0, y: 0 }, false);
    eGfx.setScale(s);

    // Ion drive glow (right side)
    eGfx.fillStyle(0x38bdf8, 0.25);
    eGfx.fillCircle(146, 48, 22);
    eGfx.fillStyle(0x38bdf8, 0.85);
    eGfx.fillTriangle(164, 40, 140, 34, 140, 62);
    eGfx.fillStyle(0xe0f2fe, 0.95);
    eGfx.fillTriangle(156, 45, 140, 41, 140, 55);

    // Upper & lower authoritarian swept fins
    eGfx.fillStyle(0x1e293b, 1);
    eGfx.beginPath();
    eGfx.moveTo(64, 36);
    eGfx.lineTo(132, 16);
    eGfx.lineTo(144, 34);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.lineStyle(1.5, 0x38bdf8, 0.8);
    eGfx.strokePath();

    eGfx.fillStyle(0x1e293b, 1);
    eGfx.beginPath();
    eGfx.moveTo(64, 60);
    eGfx.lineTo(132, 80);
    eGfx.lineTo(144, 62);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.strokePath();

    // Primary sharp dagger hull
    eGfx.fillStyle(0x334155, 1);
    eGfx.beginPath();
    eGfx.moveTo(10, 48);
    eGfx.lineTo(68, 30);
    eGfx.lineTo(142, 34);
    eGfx.lineTo(142, 62);
    eGfx.lineTo(68, 66);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.lineStyle(2, 0x38bdf8, 1);
    eGfx.strokePath();

    // Alliance markings & sensor dish
    eGfx.fillStyle(0x0284c7, 1);
    eGfx.fillRect(76, 42, 46, 12);
    eGfx.fillStyle(0x38bdf8, 1);
    eGfx.fillRect(36, 45, 26, 6);

    // Bridge slit
    eGfx.fillStyle(0xfef08a, 0.95);
    eGfx.fillRect(52, 39, 14, 4);

    eGfx.generateTexture('ship_enemy', 168 * s, 96 * s);
    eGfx.destroy();
  }

  private generateCardIcons(): void {
    const s = BootScene.TEXTURE_SCALE;
    const size = 36;

    // 1. Blaster icon (Quick Draw)
    const blaster = this.make.graphics({ x: 0, y: 0 }, false);
    blaster.setScale(s);
    blaster.lineStyle(2.5, 0xf87171, 1);
    blaster.fillStyle(0xef4444, 0.25);
    blaster.fillCircle(18, 18, 14);
    blaster.strokeCircle(18, 18, 14);
    blaster.lineBetween(18, 2, 18, 11);
    blaster.lineBetween(18, 25, 18, 34);
    blaster.lineBetween(2, 18, 11, 18);
    blaster.lineBetween(25, 18, 34, 18);
    blaster.fillStyle(0xfef08a, 1);
    blaster.fillCircle(18, 18, 3.5);
    blaster.generateTexture('icon_blaster', size * s, size * s);
    blaster.destroy();

    // 2. Rifle / Heavy Cannon icon (Vera's Whisper)
    const rifle = this.make.graphics({ x: 0, y: 0 }, false);
    rifle.setScale(s);
    rifle.fillStyle(0xef4444, 0.3);
    rifle.fillCircle(18, 18, 15);
    rifle.lineStyle(2.5, 0xfbbf24, 1);
    rifle.strokeCircle(18, 18, 13);
    rifle.lineStyle(3, 0xef4444, 1);
    rifle.lineBetween(6, 30, 30, 6);
    rifle.lineBetween(12, 6, 30, 24);
    rifle.fillStyle(0xffffff, 1);
    rifle.fillCircle(18, 18, 4);
    rifle.generateTexture('icon_rifle', size * s, size * s);
    rifle.destroy();

    // 3. Thruster / Evasive Burn icon
    const thruster = this.make.graphics({ x: 0, y: 0 }, false);
    thruster.setScale(s);
    thruster.fillStyle(0x38bdf8, 0.22);
    thruster.fillCircle(18, 18, 15);
    thruster.lineStyle(2.5, 0x38bdf8, 1);
    thruster.beginPath();
    thruster.moveTo(18, 4);
    thruster.lineTo(30, 12);
    thruster.lineTo(26, 27);
    thruster.lineTo(18, 32);
    thruster.lineTo(10, 27);
    thruster.lineTo(6, 12);
    thruster.closePath();
    thruster.strokePath();
    thruster.fillStyle(0xbae6fd, 0.8);
    thruster.fillTriangle(18, 10, 24, 23, 12, 23);
    thruster.generateTexture('icon_thruster', size * s, size * s);
    thruster.destroy();

    // 4. Crazy Ivan maneuver icon
    const maneuver = this.make.graphics({ x: 0, y: 0 }, false);
    maneuver.setScale(s);
    maneuver.fillStyle(0x38bdf8, 0.22);
    maneuver.fillCircle(18, 18, 15);
    maneuver.lineStyle(2.5, 0x38bdf8, 1);
    maneuver.strokeCircle(18, 18, 11);
    maneuver.lineStyle(2.5, 0xeab308, 1);
    maneuver.lineBetween(7, 26, 29, 10);
    maneuver.fillStyle(0xeab308, 1);
    maneuver.fillTriangle(31, 8, 22, 9, 27, 17);
    maneuver.generateTexture('icon_maneuver', size * s, size * s);
    maneuver.destroy();

    // 5. Mechanic Wrench / Duct-Tape Bypass icon
    const wrench = this.make.graphics({ x: 0, y: 0 }, false);
    wrench.setScale(s);
    wrench.fillStyle(0x22c55e, 0.22);
    wrench.fillCircle(18, 18, 15);
    wrench.lineStyle(3.5, 0x4ade80, 1);
    wrench.lineBetween(18, 7, 18, 29);
    wrench.lineBetween(7, 18, 29, 18);
    wrench.lineStyle(2, 0xbbf7d0, 1);
    wrench.strokeCircle(18, 18, 13);
    wrench.generateTexture('icon_wrench', size * s, size * s);
    wrench.destroy();

    // 6. Captain Fast Talk Comms icon
    const comms = this.make.graphics({ x: 0, y: 0 }, false);
    comms.setScale(s);
    comms.fillStyle(0xeab308, 0.22);
    comms.fillCircle(18, 18, 15);
    comms.lineStyle(2.5, 0xfacc15, 1);
    comms.strokeCircle(18, 18, 13);
    comms.lineBetween(10, 22, 15, 12);
    comms.lineBetween(15, 12, 21, 24);
    comms.lineBetween(21, 24, 26, 14);
    comms.generateTexture('icon_comms', size * s, size * s);
    comms.destroy();

    // 7. Contraband Biohazard / Warning icon
    const contra = this.make.graphics({ x: 0, y: 0 }, false);
    contra.setScale(s);
    contra.fillStyle(0xef4444, 0.28);
    contra.fillTriangle(18, 3, 33, 31, 3, 31);
    contra.lineStyle(2.5, 0xef4444, 1);
    contra.strokeTriangle(18, 3, 33, 31, 3, 31);
    contra.fillStyle(0xfef08a, 1);
    contra.fillRect(16.5, 12, 3, 10);
    contra.fillCircle(18, 26.5, 2);
    contra.generateTexture('icon_contraband', size * s, size * s);
    contra.destroy();
  }

  private generateParticleTexture(): void {
    const s = BootScene.TEXTURE_SCALE;
    const gfx = this.make.graphics({ x: 0, y: 0 }, false);
    gfx.setScale(s);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('fx_spark', 8 * s, 8 * s);
    gfx.destroy();
  }
}
