import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  // Generate procedural textures at 2x resolution for razor-sharp Retina/OLED display
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
    // Santubong deep night river indigo
    farGfx.fillStyle(0x070c18, 1);
    farGfx.fillRect(0, 0, 450, 320);

    // Borneo nebulas: Mengkudu crimson and Turmeric gold cosmic dust
    farGfx.fillStyle(0x9e2a2b, 0.08);
    farGfx.fillCircle(110, 95, 95);
    farGfx.fillStyle(0xe09f3e, 0.06);
    farGfx.fillCircle(340, 120, 105);

    const rng = new Phaser.Math.RandomDataGenerator(['sarawak-stars-far']);
    for (let i = 0; i < 90; i++) {
      const x = rng.between(2, 448);
      const y = rng.between(2, 310);
      const alpha = rng.realInRange(0.25, 0.75);
      const size = rng.pick([1, 1, 1.5, 2]);
      const color = rng.pick([0xf4f1de, 0xfde68a, 0xbae6fd]);
      farGfx.fillStyle(color, alpha);
      farGfx.fillCircle(x, y, size);
    }
    farGfx.generateTexture('bg_stars_far', 450 * s, 320 * s);
    farGfx.destroy();

    // Near starfield layer
    const nearGfx = this.make.graphics({ x: 0, y: 0 }, false);
    nearGfx.setScale(s);
    const rngNear = new Phaser.Math.RandomDataGenerator(['sarawak-stars-near']);
    for (let i = 0; i < 38; i++) {
      const x = rngNear.between(4, 446);
      const y = rngNear.between(4, 300);
      const color = rngNear.pick([0xffffff, 0xe09f3e, 0x38bdf8]);
      nearGfx.fillStyle(color, rngNear.realInRange(0.45, 0.95));
      nearGfx.fillCircle(x, y, rngNear.pick([1.2, 1.8, 2.2]));
    }
    nearGfx.generateTexture('bg_stars_near', 450 * s, 320 * s);
    nearGfx.destroy();
  }

  private generateShipTextures(): void {
    const s = BootScene.TEXTURE_SCALE;

    // =========================================================================
    // 1. SS KENYALANG-IV (Hornbill Prow / Dayak War Prahu Smuggler) - 160x96
    // =========================================================================
    const pGfx = this.make.graphics({ x: 0, y: 0 }, false);
    pGfx.setScale(s);

    // Twin Aft Thruster Flares (Amber / Turmeric Plasma)
    pGfx.fillStyle(0xe09f3e, 0.3);
    pGfx.fillCircle(18, 48, 22);
    pGfx.fillStyle(0xf59e0b, 0.85);
    pGfx.fillTriangle(2, 42, 24, 34, 24, 62);
    pGfx.fillStyle(0xfef08a, 0.95);
    pGfx.fillTriangle(8, 46, 24, 40, 24, 56);

    // Belian Ironwood Rear Engine Block
    pGfx.fillStyle(0x3b2a20, 1);
    pGfx.fillRoundedRect(22, 32, 42, 32, 5);
    pGfx.lineStyle(2, 0xe09f3e, 0.9);
    pGfx.strokeRoundedRect(22, 32, 42, 32, 5);

    // Midship Cargo Hold (Decorated with Pua Kumbu diamond chevron plating)
    pGfx.fillStyle(0x9e2a2b, 0.95);
    pGfx.fillRect(58, 36, 46, 24);
    pGfx.fillStyle(0xc85a32, 1);
    pGfx.fillRect(66, 40, 30, 16);
    pGfx.lineStyle(1.5, 0xfde68a, 0.85);
    pGfx.strokeRect(66, 40, 30, 16);

    // Outrigger Stabilizer Nacelles (River Prahu outriggers)
    pGfx.fillStyle(0x271e18, 1);
    pGfx.fillRoundedRect(48, 54, 46, 16, 4);
    pGfx.lineStyle(1.5, 0xe09f3e, 1);
    pGfx.strokeRoundedRect(48, 54, 46, 16, 4);
    // Outrigger plasma nozzle
    pGfx.fillStyle(0xf59e0b, 0.9);
    pGfx.fillCircle(48, 62, 4);

    // Kenyalang Casque (Hornbill Forward Sweeping Beak & Crest Cockpit)
    pGfx.fillStyle(0xd97724, 1);
    pGfx.beginPath();
    pGfx.moveTo(98, 38);
    pGfx.lineTo(138, 34); // Upper hornbill casque sweep
    pGfx.lineTo(154, 46); // Beak tip
    pGfx.lineTo(142, 58); // Lower mandible
    pGfx.lineTo(98, 58);
    pGfx.closePath();
    pGfx.fillPath();

    // Hornbill Golden Casque Ridge
    pGfx.fillStyle(0xf59e0b, 1);
    pGfx.beginPath();
    pGfx.moveTo(112, 36);
    pGfx.lineTo(142, 28);
    pGfx.lineTo(148, 38);
    pGfx.closePath();
    pGfx.fillPath();
    pGfx.lineStyle(1.5, 0xfef08a, 1);
    pGfx.strokePath();

    // Forward Canopy / Sensor Eye slit
    pGfx.fillStyle(0x38bdf8, 0.9);
    pGfx.beginPath();
    pGfx.moveTo(122, 42);
    pGfx.lineTo(142, 44);
    pGfx.lineTo(136, 49);
    pGfx.lineTo(120, 48);
    pGfx.closePath();
    pGfx.fillPath();

    // Dayak Ukir Warding Antennae
    pGfx.lineStyle(1.5, 0xfef08a, 0.8);
    pGfx.lineBetween(74, 36, 68, 20);
    pGfx.lineBetween(90, 36, 86, 24);

    pGfx.generateTexture('ship_player', 160 * s, 96 * s);
    pGfx.destroy();

    // =========================================================================
    // 2. ALLIANCE RAJAH CUTTER (Colonial customs gunboat) - 168x96
    // =========================================================================
    const eGfx = this.make.graphics({ x: 0, y: 0 }, false);
    eGfx.setScale(s);

    // Ion Drive Flare (Stern - right side)
    eGfx.fillStyle(0x0284c7, 0.3);
    eGfx.fillCircle(146, 48, 22);
    eGfx.fillStyle(0x38bdf8, 0.85);
    eGfx.fillTriangle(164, 40, 140, 34, 140, 62);
    eGfx.fillStyle(0xe0f2fe, 0.95);
    eGfx.fillTriangle(156, 45, 140, 41, 140, 55);

    // Heavy Colonial Swept Armour Fins
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

    // Primary Ironclad Wedge Hull
    eGfx.fillStyle(0x334155, 1);
    eGfx.beginPath();
    eGfx.moveTo(10, 48); // Aggressive ramming bow
    eGfx.lineTo(68, 30);
    eGfx.lineTo(142, 34);
    eGfx.lineTo(142, 62);
    eGfx.lineTo(68, 66);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.lineStyle(2, 0x38bdf8, 1);
    eGfx.strokePath();

    // Customs Scanner Pod & Turret
    eGfx.fillStyle(0x0284c7, 1);
    eGfx.fillRect(76, 42, 46, 12);
    eGfx.fillStyle(0xfacc15, 0.9);
    eGfx.fillRect(36, 45, 26, 6);

    // Imperial bridge viewing slit
    eGfx.fillStyle(0xffffff, 0.95);
    eGfx.fillRect(52, 39, 14, 4);

    eGfx.generateTexture('ship_enemy', 168 * s, 96 * s);
    eGfx.destroy();
  }

  private generateCardIcons(): void {
    const s = BootScene.TEXTURE_SCALE;
    const size = 36;

    // 1. Parang Snap (Dayak curved parang blade)
    const parang = this.make.graphics({ x: 0, y: 0 }, false);
    parang.setScale(s);
    parang.fillStyle(0x9e2a2b, 0.3);
    parang.fillCircle(18, 18, 15);
    parang.lineStyle(2.5, 0xe09f3e, 1);
    parang.strokeCircle(18, 18, 14);
    // Curved parang blade
    parang.lineStyle(3, 0xfde68a, 1);
    parang.beginPath();
    parang.moveTo(8, 28); // hilt
    parang.lineTo(14, 22);
    parang.lineTo(26, 10);
    parang.lineTo(28, 8); // point
    parang.strokePath();
    // Parang brass bolster / hilt
    parang.fillStyle(0xe09f3e, 1);
    parang.fillCircle(9, 27, 3);
    parang.generateTexture('icon_parang', size * s, size * s);
    parang.destroy();

    // 2. Sumpit Dart (Ironwood blowpipe with venom dart)
    const sumpit = this.make.graphics({ x: 0, y: 0 }, false);
    sumpit.setScale(s);
    sumpit.fillStyle(0x9e2a2b, 0.3);
    sumpit.fillCircle(18, 18, 15);
    sumpit.lineStyle(2.5, 0xef4444, 1);
    sumpit.strokeCircle(18, 18, 14);
    // Long ironwood blowpipe tube
    sumpit.lineStyle(2.5, 0x78350f, 1);
    sumpit.lineBetween(6, 30, 26, 10);
    // Poison dart exiting muzzle
    sumpit.lineStyle(2, 0x4ade80, 1);
    sumpit.lineBetween(26, 10, 31, 5);
    sumpit.fillStyle(0x4ade80, 1);
    sumpit.fillCircle(31, 5, 2);
    sumpit.generateTexture('icon_sumpit', size * s, size * s);
    sumpit.destroy();

    // 3. Rapid Skim (River draft speed wake)
    const rapid = this.make.graphics({ x: 0, y: 0 }, false);
    rapid.setScale(s);
    rapid.fillStyle(0x38bdf8, 0.22);
    rapid.fillCircle(18, 18, 15);
    rapid.lineStyle(2.5, 0x38bdf8, 1);
    rapid.strokeCircle(18, 18, 14);
    // Flowing water wake chevrons
    rapid.beginPath();
    rapid.moveTo(10, 14);
    rapid.lineTo(18, 9);
    rapid.lineTo(26, 14);
    rapid.moveTo(10, 20);
    rapid.lineTo(18, 15);
    rapid.lineTo(26, 20);
    rapid.moveTo(12, 26);
    rapid.lineTo(18, 22);
    rapid.lineTo(24, 26);
    rapid.strokePath();
    rapid.generateTexture('icon_rapid_skim', size * s, size * s);
    rapid.destroy();

    // 4. Rajang Whirlpool (Pelagus rapids vortex)
    const rajang = this.make.graphics({ x: 0, y: 0 }, false);
    rajang.setScale(s);
    rajang.fillStyle(0x38bdf8, 0.22);
    rajang.fillCircle(18, 18, 15);
    rajang.lineStyle(2.5, 0x38bdf8, 1);
    rajang.strokeCircle(18, 18, 14);
    // Whirlpool spiral
    rajang.lineStyle(2.5, 0xe09f3e, 1);
    rajang.beginPath();
    rajang.arc(18, 18, 9, 0, Math.PI * 1.5, false);
    rajang.strokePath();
    rajang.lineStyle(2.5, 0x38bdf8, 1);
    rajang.beginPath();
    rajang.arc(18, 18, 4, Math.PI * 0.5, Math.PI * 2, false);
    rajang.strokePath();
    rajang.fillStyle(0xfef08a, 1);
    rajang.fillCircle(18, 18, 2.5);
    rajang.generateTexture('icon_rajang', size * s, size * s);
    rajang.destroy();

    // 5. Rattan Lashing (Braided jungle vine binding)
    const rattan = this.make.graphics({ x: 0, y: 0 }, false);
    rattan.setScale(s);
    rattan.fillStyle(0x16a34a, 0.22);
    rattan.fillCircle(18, 18, 15);
    rattan.lineStyle(2.5, 0x4ade80, 1);
    rattan.strokeCircle(18, 18, 14);
    // Diamond braided woven rattan cross
    rattan.lineStyle(3, 0xfacc15, 1);
    rattan.lineBetween(10, 10, 26, 26);
    rattan.lineBetween(26, 10, 10, 26);
    rattan.fillStyle(0x22c55e, 1);
    rattan.fillCircle(18, 18, 4);
    rattan.generateTexture('icon_rattan', size * s, size * s);
    rattan.destroy();

    // 6. Bazaar Haggling (Waterfront merchant coins & scale)
    const haggling = this.make.graphics({ x: 0, y: 0 }, false);
    haggling.setScale(s);
    haggling.fillStyle(0xe09f3e, 0.22);
    haggling.fillCircle(18, 18, 15);
    haggling.lineStyle(2.5, 0xfacc15, 1);
    haggling.strokeCircle(18, 18, 14);
    // Twin barter coins with trade comms arc
    haggling.fillStyle(0xfde68a, 1);
    haggling.fillCircle(14, 20, 5);
    haggling.fillCircle(22, 15, 5);
    haggling.lineStyle(2, 0xe09f3e, 1);
    haggling.strokeCircle(14, 20, 5);
    haggling.strokeCircle(22, 15, 5);
    haggling.generateTexture('icon_haggling', size * s, size * s);
    haggling.destroy();

    // 7. Sarikei Black Gold (Pepper pods with thermal heat glow)
    const pepper = this.make.graphics({ x: 0, y: 0 }, false);
    pepper.setScale(s);
    pepper.fillStyle(0x9e2a2b, 0.35);
    pepper.fillCircle(18, 18, 15);
    pepper.lineStyle(2.5, 0xef4444, 1);
    pepper.strokeCircle(18, 18, 14);
    // Cluster of 4 black peppercorns with amber spice aura
    pepper.fillStyle(0x18181b, 1);
    pepper.fillCircle(14, 15, 4);
    pepper.fillCircle(22, 14, 4);
    pepper.fillCircle(18, 22, 4.5);
    pepper.lineStyle(1.5, 0xf59e0b, 1);
    pepper.strokeCircle(14, 15, 4);
    pepper.strokeCircle(22, 14, 4);
    pepper.strokeCircle(18, 22, 4.5);
    // Heat wave lines
    pepper.lineStyle(1.5, 0xef4444, 0.9);
    pepper.beginPath();
    pepper.moveTo(13, 8);
    pepper.lineTo(15, 5);
    pepper.moveTo(18, 8);
    pepper.lineTo(18, 4);
    pepper.moveTo(23, 8);
    pepper.lineTo(21, 5);
    pepper.strokePath();
    pepper.generateTexture('icon_pepper', size * s, size * s);
    pepper.destroy();

    // 8. Bungai Terung (8-petal Eggplant Flower Rosette)
    const bungai = this.make.graphics({ x: 0, y: 0 }, false);
    bungai.setScale(s);
    bungai.fillStyle(0xe09f3e, 1);
    bungai.fillCircle(18, 18, 14);
    bungai.fillStyle(0x070c18, 1);
    bungai.fillCircle(18, 18, 11);
    bungai.lineStyle(2, 0xfde68a, 1);
    // 8 radiating petals
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = 18 + Math.cos(angle) * 7;
      const py = 18 + Math.sin(angle) * 7;
      bungai.fillStyle(0xf59e0b, 1);
      bungai.fillCircle(px, py, 2.5);
    }
    bungai.fillStyle(0xfde68a, 1);
    bungai.fillCircle(18, 18, 3.5);
    bungai.generateTexture('icon_bungai', size * s, size * s);
    bungai.destroy();

    // 9. Terabai (Hexagonal War Shield)
    const terabai = this.make.graphics({ x: 0, y: 0 }, false);
    terabai.setScale(s);
    terabai.fillStyle(0x0c4a6e, 0.9);
    terabai.beginPath();
    terabai.moveTo(18, 3); // top point
    terabai.lineTo(31, 10);
    terabai.lineTo(31, 26);
    terabai.lineTo(18, 33); // bottom point
    terabai.lineTo(5, 26);
    terabai.lineTo(5, 10);
    terabai.closePath();
    terabai.fillPath();
    terabai.lineStyle(2, 0x38bdf8, 1);
    terabai.strokePath();
    // Central spine & Aso' ward
    terabai.lineStyle(1.5, 0xfde68a, 1);
    terabai.lineBetween(18, 6, 18, 30);
    terabai.strokeCircle(18, 18, 4);
    terabai.generateTexture('icon_terabai', size * s, size * s);
    terabai.destroy();
  }

  private generateParticleTexture(): void {
    const s = BootScene.TEXTURE_SCALE;
    const gfx = this.make.graphics({ x: 0, y: 0 }, false);
    gfx.setScale(s);
    gfx.fillStyle(0xfde68a, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('fx_spark', 8 * s, 8 * s);
    gfx.destroy();
  }
}
