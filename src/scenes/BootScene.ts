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
    // 1. SS KENYALANG-IV (Hornbill Prow / Dayak War Prahu Smuggler) - 168x100
    // =========================================================================
    const pGfx = this.make.graphics({ x: 0, y: 0 }, false);
    pGfx.setScale(s);

    // --- Dynamic Lighting Setup: Simulated Top-Left Sun Highlight ---
    // Deep Under-Hull Ambient Drop Shadow
    pGfx.fillStyle(0x0a0604, 0.45);
    pGfx.fillEllipse(84, 58, 126, 36);

    // Twin Aft Thruster Flares (Amber / Turmeric Plasma Cone Base)
    pGfx.fillStyle(0xe09f3e, 0.28);
    pGfx.fillCircle(18, 50, 24);
    pGfx.fillStyle(0xf59e0b, 0.85);
    pGfx.fillTriangle(2, 44, 26, 34, 26, 66);
    pGfx.fillStyle(0xfef08a, 0.95);
    pGfx.fillTriangle(8, 48, 26, 42, 26, 58);

    // --- Outrigger Stabilizer Nacelles (Sarawakian River Prahu Sponsons) ---
    // Lower Prahu Sponson & Articulated Titanium Struts
    pGfx.fillStyle(0x1e293b, 1);
    pGfx.fillRect(52, 64, 8, 12);
    pGfx.fillRect(86, 64, 8, 12);
    // Lower Sponson Body (Dark Oiled Belian Ironwood)
    pGfx.fillStyle(0x1c120c, 1);
    pGfx.fillRoundedRect(42, 72, 58, 14, 5);
    pGfx.fillStyle(0x382318, 1);
    pGfx.fillRoundedRect(44, 73, 54, 7, 3); // Top highlight
    pGfx.lineStyle(1.5, 0xd97724, 0.9);
    pGfx.strokeRoundedRect(42, 72, 58, 14, 5);
    // Outrigger maneuvering RCS cold-gas jet
    pGfx.fillStyle(0x38bdf8, 0.95);
    pGfx.fillCircle(42, 79, 3);
    pGfx.fillStyle(0xffffff, 1);
    pGfx.fillCircle(42, 79, 1.5);

    // Upper Dorsal Stabilizer Fin
    pGfx.fillStyle(0x1e293b, 1);
    pGfx.fillRect(56, 22, 6, 12);
    pGfx.fillStyle(0x2e1a12, 1);
    pGfx.fillRoundedRect(50, 14, 46, 12, 4);
    pGfx.lineStyle(1.5, 0xe09f3e, 0.85);
    pGfx.strokeRoundedRect(50, 14, 46, 12, 4);

    // --- Heavy Belian Ironwood Rear Engine Block (x: 24..66, y: 32..68) ---
    // Deep structural chassis base
    pGfx.fillStyle(0x1a0f0a, 1);
    pGfx.fillRoundedRect(22, 30, 46, 40, 6);
    // Oiled Belian woodgrain gradient layers
    pGfx.fillStyle(0x2f1b12, 1);
    pGfx.fillRoundedRect(24, 32, 42, 36, 5);
    pGfx.fillStyle(0x4a2c1d, 1);
    pGfx.fillRoundedRect(25, 33, 40, 16, 4); // Sunlit upper engine bevel
    pGfx.lineStyle(2, 0xd97724, 0.95);
    pGfx.strokeRoundedRect(24, 32, 42, 36, 5);
    // Specular top highlight ridge
    pGfx.lineStyle(1.5, 0xfef08a, 0.9);
    pGfx.lineBetween(26, 32, 64, 32);

    // Engine Slotted Radiator Vents (Thermal cooling grills)
    for (let vy = 38; vy <= 58; vy += 5) {
      pGfx.fillStyle(0x0f172a, 1);
      pGfx.fillRect(30, vy, 20, 3);
      pGfx.fillStyle(0x9a3412, 0.85);
      pGfx.fillRect(31, vy + 1, 18, 1); // Subtle internal heat shimmer filament
    }

    // Heavy Brass Rivet Studs along engine casing
    const rivets = [
      { x: 26, y: 35 }, { x: 62, y: 35 },
      { x: 26, y: 64 }, { x: 62, y: 64 },
    ];
    for (const r of rivets) {
      pGfx.fillStyle(0xf59e0b, 1);
      pGfx.fillCircle(r.x, r.y, 1.8);
      pGfx.fillStyle(0xffffff, 0.9);
      pGfx.fillCircle(r.x - 0.5, r.y - 0.5, 0.8);
    }

    // --- Midship Cargo Hold: Pua Kumbu Nanoweave Carbon Armor (x: 64..108, y: 32..68) ---
    // Deep Madder Crimson Base
    pGfx.fillStyle(0x6b101e, 1);
    pGfx.fillRect(64, 33, 44, 34);
    pGfx.fillStyle(0x881337, 1);
    pGfx.fillRect(66, 35, 40, 30);
    // Directional lighting highlight on upper cargo plate
    pGfx.fillStyle(0x9f1239, 1);
    pGfx.fillRect(66, 35, 40, 12);

    // Pua Kumbu Diamond Nanoweave Chevron Lattice
    pGfx.lineStyle(1.5, 0xd97724, 0.85);
    // Diamond 1
    pGfx.beginPath();
    pGfx.moveTo(74, 50); pGfx.lineTo(80, 42); pGfx.lineTo(86, 50); pGfx.lineTo(80, 58);
    pGfx.closePath();
    pGfx.strokePath();
    // Diamond 2
    pGfx.beginPath();
    pGfx.moveTo(86, 50); pGfx.lineTo(92, 42); pGfx.lineTo(98, 50); pGfx.lineTo(92, 58);
    pGfx.closePath();
    pGfx.strokePath();

    // Cargo Hold Heavy Armor Rim with Specular Gold Edging
    pGfx.lineStyle(2, 0xf59e0b, 0.9);
    pGfx.strokeRect(66, 35, 40, 30);
    pGfx.lineStyle(1.5, 0xfef08a, 1);
    pGfx.lineBetween(66, 35, 106, 35); // Upper specular glint

    // --- Dayak Bungai Terung Reactor Rosette Motif (Centered at x: 86, y: 50) ---
    // Outer Warding Ring
    pGfx.lineStyle(1.8, 0xd97724, 0.95);
    pGfx.strokeCircle(86, 50, 11);
    pGfx.lineStyle(1, 0xfacc15, 0.7);
    pGfx.strokeCircle(86, 50, 8.5);

    // 8 Spiraling Dayak Petals
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const x1 = 86 + Math.cos(ang) * 3;
      const y1 = 50 + Math.sin(ang) * 3;
      const x2 = 86 + Math.cos(ang + 0.35) * 8.5;
      const y2 = 50 + Math.sin(ang + 0.35) * 8.5;
      pGfx.lineStyle(1.4, 0xfef08a, 0.9);
      pGfx.lineBetween(x1, y1, x2, y2);
      pGfx.fillStyle(0xf59e0b, 1);
      pGfx.fillCircle(x2, y2, 1.2);
    }

    // Glowing Amber / White Fusion Micro-Core
    pGfx.fillStyle(0xfef08a, 1);
    pGfx.fillCircle(86, 50, 3.2);
    pGfx.fillStyle(0xffffff, 1);
    pGfx.fillCircle(86, 50, 1.6);

    // Glowing Power Conduit Lines radiating fore & aft
    pGfx.lineStyle(1.4, 0xfbbf24, 0.85);
    pGfx.lineBetween(66, 50, 75, 50);
    pGfx.lineBetween(97, 50, 106, 50);

    // --- Kenyalang Casque & Forward Prow Cockpit (x: 104..162, y: 26..66) ---
    // Main Prow Forward Wedge
    pGfx.fillStyle(0x7c2d12, 1); // Dark burnt sienna base
    pGfx.beginPath();
    pGfx.moveTo(104, 34);
    pGfx.lineTo(146, 32);
    pGfx.lineTo(162, 48); // Sharp beak point
    pGfx.lineTo(148, 62);
    pGfx.lineTo(104, 62);
    pGfx.closePath();
    pGfx.fillPath();

    // Directional Sunlit Upper Prow Plating
    pGfx.fillStyle(0xc2410c, 1);
    pGfx.beginPath();
    pGfx.moveTo(104, 34);
    pGfx.lineTo(146, 32);
    pGfx.lineTo(162, 48);
    pGfx.lineTo(144, 48);
    pGfx.lineTo(104, 48);
    pGfx.closePath();
    pGfx.fillPath();

    // Polished Hornbill Golden Casque Ridge (Burung Kenyalang Crest)
    pGfx.fillStyle(0xd97724, 1);
    pGfx.beginPath();
    pGfx.moveTo(114, 34);
    pGfx.lineTo(144, 24); // Sweeping upward curve
    pGfx.lineTo(154, 36);
    pGfx.lineTo(134, 36);
    pGfx.closePath();
    pGfx.fillPath();

    pGfx.fillStyle(0xf59e0b, 1);
    pGfx.beginPath();
    pGfx.moveTo(118, 33);
    pGfx.lineTo(144, 25);
    pGfx.lineTo(152, 34);
    pGfx.lineTo(136, 34);
    pGfx.closePath();
    pGfx.fillPath();

    // Specular Hornbill Casque Rim Stroke
    pGfx.lineStyle(1.8, 0xfef08a, 1);
    pGfx.strokePath();

    // Lower Mandible Beak Cutting Rim
    pGfx.lineStyle(1.8, 0xf59e0b, 1);
    pGfx.lineBetween(162, 48, 148, 62);
    pGfx.lineBetween(148, 62, 104, 62);

    // --- High-Tech Polarized Bridge Canopy (Cockpit Visor) ---
    pGfx.fillStyle(0x0c4a6e, 1);
    pGfx.beginPath();
    pGfx.moveTo(126, 42);
    pGfx.lineTo(148, 43);
    pGfx.lineTo(142, 50);
    pGfx.lineTo(124, 49);
    pGfx.closePath();
    pGfx.fillPath();

    // Holographic Flight Display Interior Glow
    pGfx.fillStyle(0x38bdf8, 0.95);
    pGfx.fillRect(128, 44, 15, 3);
    pGfx.fillStyle(0xe0f2fe, 1);
    pGfx.fillRect(132, 45, 8, 1.5);
    // Canopy Glass Specular Slash
    pGfx.lineStyle(1.2, 0xffffff, 0.95);
    pGfx.lineBetween(140, 42, 144, 50);

    // --- Dayak Carved Belian Ukir Antennae & Navigation Strobe Masts ---
    pGfx.lineStyle(1.5, 0xfef08a, 0.85);
    pGfx.lineBetween(74, 33, 68, 18);
    pGfx.lineBetween(94, 33, 90, 20);
    pGfx.fillStyle(0xfde68a, 1);
    pGfx.fillCircle(68, 18, 1.8);
    pGfx.fillCircle(90, 20, 1.8);

    // Navigation Strobe Mounting Beacons
    pGfx.fillStyle(0x22c55e, 1); // Starboard Green (Dorsal)
    pGfx.fillCircle(50, 14, 2);
    pGfx.fillStyle(0xef4444, 1); // Port Red (Ventral)
    pGfx.fillCircle(42, 72, 2);

    pGfx.generateTexture('ship_player', 168 * s, 100 * s);
    pGfx.destroy();

    // =========================================================================
    // 2. ALLIANCE RAJAH CUTTER (Colonial customs gunboat) - 176x100
    // =========================================================================
    const eGfx = this.make.graphics({ x: 0, y: 0 }, false);
    eGfx.setScale(s);

    // Ambient Under-Hull Shadow
    eGfx.fillStyle(0x050b14, 0.45);
    eGfx.fillEllipse(92, 58, 134, 38);

    // Dual Heavy Ion Drive Flares (Stern - right side)
    eGfx.fillStyle(0x0284c7, 0.28);
    eGfx.fillCircle(154, 50, 24);
    eGfx.fillStyle(0x38bdf8, 0.85);
    eGfx.fillTriangle(172, 42, 146, 34, 146, 66);
    eGfx.fillStyle(0xe0f2fe, 0.95);
    eGfx.fillTriangle(164, 46, 146, 40, 146, 60);

    // Heavy Colonial Swept Armour Fins (Ventral & Dorsal Stabilizers)
    // Dorsal Fin
    eGfx.fillStyle(0x0f172a, 1);
    eGfx.beginPath();
    eGfx.moveTo(68, 34); eGfx.lineTo(138, 14); eGfx.lineTo(150, 32);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.fillStyle(0x1e293b, 1);
    eGfx.beginPath();
    eGfx.moveTo(74, 34); eGfx.lineTo(134, 18); eGfx.lineTo(144, 32);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.lineStyle(1.8, 0x38bdf8, 0.9);
    eGfx.strokePath();

    // Ventral Fin
    eGfx.fillStyle(0x0f172a, 1);
    eGfx.beginPath();
    eGfx.moveTo(68, 66); eGfx.lineTo(138, 86); eGfx.lineTo(150, 68);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.fillStyle(0x1e293b, 1);
    eGfx.beginPath();
    eGfx.moveTo(74, 66); eGfx.lineTo(134, 82); eGfx.lineTo(144, 68);
    eGfx.closePath();
    eGfx.fillPath();
    eGfx.lineStyle(1.8, 0x0284c7, 0.9);
    eGfx.strokePath();

    // Primary Ironclad Wedge Hull (Chobham Armor Plates)
    // Dark Underplate
    eGfx.fillStyle(0x1e293b, 1);
    eGfx.beginPath();
    eGfx.moveTo(10, 50); // Aggressive ramming bow
    eGfx.lineTo(72, 28);
    eGfx.lineTo(148, 32);
    eGfx.lineTo(148, 68);
    eGfx.lineTo(72, 72);
    eGfx.closePath();
    eGfx.fillPath();

    // Sunlit Dorsal Armor Plate (Top-Left Key Light)
    eGfx.fillStyle(0x334155, 1);
    eGfx.beginPath();
    eGfx.moveTo(10, 50);
    eGfx.lineTo(72, 28);
    eGfx.lineTo(148, 32);
    eGfx.lineTo(148, 50);
    eGfx.lineTo(10, 50);
    eGfx.closePath();
    eGfx.fillPath();

    // Faceted Highlight Plate
    eGfx.fillStyle(0x475569, 1);
    eGfx.beginPath();
    eGfx.moveTo(24, 48);
    eGfx.lineTo(70, 31);
    eGfx.lineTo(142, 34);
    eGfx.lineTo(142, 44);
    eGfx.lineTo(24, 48);
    eGfx.closePath();
    eGfx.fillPath();

    // Specular Upper Ridge Rim
    eGfx.lineStyle(2, 0x38bdf8, 1);
    eGfx.strokePath();
    eGfx.lineStyle(1.5, 0xffffff, 0.9);
    eGfx.lineBetween(10, 50, 72, 28);
    eGfx.lineBetween(72, 28, 148, 32);

    // Deep Recessed Armor Seam Panel Lines
    eGfx.lineStyle(1.5, 0x0f172a, 1);
    eGfx.lineBetween(72, 28, 72, 72);
    eGfx.lineBetween(110, 32, 110, 68);

    // Colonial Authority Naval Blue Livery Stripe
    eGfx.fillStyle(0x0284c7, 0.95);
    eGfx.fillRect(74, 46, 52, 8);
    eGfx.fillStyle(0xfacc15, 1);
    eGfx.fillRect(74, 54, 52, 2.5); // Gold rank stripe

    // Kinetic Autocannon Batteries (Dorsal & Ventral Barrels protruding forward)
    // Dorsal Autocannon
    eGfx.fillStyle(0x475569, 1);
    eGfx.fillRect(36, 26, 24, 6);
    eGfx.fillStyle(0x94a3b8, 1);
    eGfx.fillRect(20, 27, 18, 4); // Twin barrel
    eGfx.fillStyle(0xf8fafc, 1);
    eGfx.fillRect(18, 27, 3, 4); // Muzzle brake tip

    // Ventral Autocannon
    eGfx.fillStyle(0x334155, 1);
    eGfx.fillRect(36, 68, 24, 6);
    eGfx.fillStyle(0x64748b, 1);
    eGfx.fillRect(20, 69, 18, 4);
    eGfx.fillStyle(0xf8fafc, 1);
    eGfx.fillRect(18, 69, 3, 4);

    // Imperial Tactical Command Bridge (Multi-paned Observation Canopy)
    eGfx.fillStyle(0x0c4a6e, 1);
    eGfx.fillRect(52, 38, 22, 8);
    eGfx.fillStyle(0x38bdf8, 1);
    eGfx.fillRect(54, 40, 18, 4);
    eGfx.fillStyle(0xffffff, 0.95);
    eGfx.fillRect(58, 41, 10, 2);

    // Forward Targeting Sensor Aperture (Blue Target Lock Blister)
    eGfx.fillStyle(0x0284c7, 1);
    eGfx.fillCircle(32, 49, 4);
    eGfx.fillStyle(0x7dd3fc, 1);
    eGfx.fillCircle(32, 49, 2);
    eGfx.fillStyle(0xffffff, 1);
    eGfx.fillCircle(31, 48, 1);

    // Navigation Strobe Beacons
    eGfx.fillStyle(0x38bdf8, 1);
    eGfx.fillCircle(138, 14, 2);
    eGfx.fillStyle(0xef4444, 1);
    eGfx.fillCircle(138, 86, 2);

    eGfx.generateTexture('ship_enemy_cutter', 176 * s, 100 * s);
    eGfx.generateTexture('ship_enemy', 176 * s, 100 * s);
    eGfx.destroy();

    // =========================================================================
    // 3. CUSTOMS PATROL SKIFF (Fast nimble recon skiff - Sector 1) - 148x84
    // =========================================================================
    const skiffGfx = this.make.graphics({ x: 0, y: 0 }, false);
    skiffGfx.setScale(s);

    // Drop Shadow
    skiffGfx.fillStyle(0x050b14, 0.4);
    skiffGfx.fillEllipse(78, 48, 110, 28);

    // Twin High-Velocity Ion Thrusters (Stern)
    skiffGfx.fillStyle(0x38bdf8, 0.28);
    skiffGfx.fillCircle(132, 42, 18);
    skiffGfx.fillStyle(0x38bdf8, 0.9);
    skiffGfx.fillTriangle(144, 35, 126, 30, 126, 54);
    skiffGfx.fillStyle(0xffffff, 0.95);
    skiffGfx.fillTriangle(138, 39, 126, 36, 126, 48);

    // Swept Radar Wings
    skiffGfx.fillStyle(0x1e293b, 1);
    skiffGfx.beginPath();
    skiffGfx.moveTo(60, 26); skiffGfx.lineTo(104, 12); skiffGfx.lineTo(112, 28);
    skiffGfx.closePath();
    skiffGfx.fillPath();
    skiffGfx.lineStyle(1.5, 0x0284c7, 0.9);
    skiffGfx.strokePath();

    skiffGfx.fillStyle(0x1e293b, 1);
    skiffGfx.beginPath();
    skiffGfx.moveTo(60, 58); skiffGfx.lineTo(104, 72); skiffGfx.lineTo(112, 56);
    skiffGfx.closePath();
    skiffGfx.fillPath();
    skiffGfx.lineStyle(1.5, 0x0284c7, 0.9);
    skiffGfx.strokePath();

    // Needle-Nose Interceptor Fuselage
    // Dark Lower Fuselage
    skiffGfx.fillStyle(0x1e293b, 1);
    skiffGfx.beginPath();
    skiffGfx.moveTo(8, 42); // Razor sharp nose
    skiffGfx.lineTo(62, 26);
    skiffGfx.lineTo(128, 30);
    skiffGfx.lineTo(128, 54);
    skiffGfx.lineTo(62, 58);
    skiffGfx.closePath();
    skiffGfx.fillPath();

    // Sunlit Naval White Dorsal Armor
    skiffGfx.fillStyle(0xe2e8f0, 1);
    skiffGfx.beginPath();
    skiffGfx.moveTo(8, 42);
    skiffGfx.lineTo(62, 26);
    skiffGfx.lineTo(128, 30);
    skiffGfx.lineTo(128, 42);
    skiffGfx.lineTo(8, 42);
    skiffGfx.closePath();
    skiffGfx.fillPath();

    // Specular Spine Highlight
    skiffGfx.lineStyle(1.8, 0xffffff, 1);
    skiffGfx.lineBetween(8, 42, 62, 26);
    skiffGfx.lineBetween(62, 26, 128, 30);

    // Naval Blue Authority Decal
    skiffGfx.fillStyle(0x0369a1, 1);
    skiffGfx.fillRect(66, 38, 42, 6);

    // Hazard Stripes on Intake Collar (Black & Yellow Chevrons)
    skiffGfx.fillStyle(0xfacc15, 1);
    skiffGfx.fillRect(44, 37, 18, 10);
    skiffGfx.fillStyle(0x0f172a, 1);
    skiffGfx.beginPath();
    skiffGfx.moveTo(46, 47); skiffGfx.lineTo(50, 37); skiffGfx.lineTo(53, 37); skiffGfx.lineTo(49, 47);
    skiffGfx.closePath();
    skiffGfx.fillPath();
    skiffGfx.beginPath();
    skiffGfx.moveTo(54, 47); skiffGfx.lineTo(58, 37); skiffGfx.lineTo(61, 37); skiffGfx.lineTo(57, 47);
    skiffGfx.closePath();
    skiffGfx.fillPath();

    // Forward Long-Range Comm / Target Needle
    skiffGfx.lineStyle(2, 0x64748b, 1);
    skiffGfx.lineBetween(8, 42, 2, 42);
    skiffGfx.fillStyle(0xef4444, 1);
    skiffGfx.fillCircle(2, 42, 1.5); // Red sensor optic

    // Tactical Visor / Cockpit Slit
    skiffGfx.fillStyle(0x0284c7, 1);
    skiffGfx.fillRect(32, 40, 10, 4);
    skiffGfx.fillStyle(0x7dd3fc, 1);
    skiffGfx.fillRect(34, 41, 6, 2);

    skiffGfx.generateTexture('ship_enemy_skiff', 148 * s, 84 * s);
    skiffGfx.destroy();

    // =========================================================================
    // 4. BROOKE IRONCLAD DREADNOUGHT (Massive Flagship - Sector 3) - 216x128
    // =========================================================================
    const dreadGfx = this.make.graphics({ x: 0, y: 0 }, false);
    dreadGfx.setScale(s);

    // Massive Fortress Deep Shadow
    dreadGfx.fillStyle(0x050810, 0.55);
    dreadGfx.fillEllipse(112, 74, 184, 52);

    // Quad Heavy Ion Thruster Bells (Stacked Stern Propulsion)
    const thrusterY = [36, 54, 74, 92];
    for (const ty of thrusterY) {
      dreadGfx.fillStyle(0xef4444, 0.28);
      dreadGfx.fillCircle(188, ty, 18);
      dreadGfx.fillStyle(0xf97316, 0.85);
      dreadGfx.fillTriangle(208, ty, 180, ty - 8, 180, ty + 8);
      dreadGfx.fillStyle(0xfef08a, 0.95);
      dreadGfx.fillTriangle(198, ty, 180, ty - 4, 180, ty + 4);

      // Heavy Iron Exhaust Bell Cowlings
      dreadGfx.fillStyle(0x1e293b, 1);
      dreadGfx.fillRect(174, ty - 7, 10, 14);
      dreadGfx.lineStyle(1.5, 0xd97724, 0.9);
      dreadGfx.strokeRect(174, ty - 7, 10, 14);
    }

    // Heavy Ironclad Citadel Bulkhead (Multi-Tiered Armor)
    // Layer 1: Dark Base Steel Hull
    dreadGfx.fillStyle(0x090d16, 1);
    dreadGfx.fillRect(72, 24, 106, 80);
    dreadGfx.lineStyle(3, 0xef4444, 0.9);
    dreadGfx.strokeRect(72, 24, 106, 80);

    // Layer 2: Massive Armored Crushing Ram Prow (Forward Hull)
    dreadGfx.fillStyle(0x0f172a, 1);
    dreadGfx.beginPath();
    dreadGfx.moveTo(8, 64); // Vicious naval ram prow
    dreadGfx.lineTo(76, 20);
    dreadGfx.lineTo(180, 24);
    dreadGfx.lineTo(180, 104);
    dreadGfx.lineTo(76, 108);
    dreadGfx.closePath();
    dreadGfx.fillPath();

    // Directional Lighting on Upper Armor Plate
    dreadGfx.fillStyle(0x1e293b, 1);
    dreadGfx.beginPath();
    dreadGfx.moveTo(8, 64);
    dreadGfx.lineTo(76, 20);
    dreadGfx.lineTo(180, 24);
    dreadGfx.lineTo(180, 64);
    dreadGfx.lineTo(8, 64);
    dreadGfx.closePath();
    dreadGfx.fillPath();

    // Weathered Steel Highlight Facet
    dreadGfx.fillStyle(0x334155, 1);
    dreadGfx.beginPath();
    dreadGfx.moveTo(24, 62);
    dreadGfx.lineTo(74, 24);
    dreadGfx.lineTo(176, 28);
    dreadGfx.lineTo(176, 44);
    dreadGfx.lineTo(24, 62);
    dreadGfx.closePath();
    dreadGfx.fillPath();

    // Specular Rim on Upper Citadel Edge
    dreadGfx.lineStyle(2.5, 0x64748b, 1);
    dreadGfx.strokePath();
    dreadGfx.lineStyle(1.8, 0xfacc15, 0.85);
    dreadGfx.lineBetween(8, 64, 76, 20);
    dreadGfx.lineBetween(76, 20, 180, 24);

    // Victorian Brass Rivet Seams across Hull Bulkheads
    const dreadRivetsX = [84, 108, 132, 156];
    for (const rx of dreadRivetsX) {
      dreadGfx.lineStyle(1, 0x090d16, 1);
      dreadGfx.lineBetween(rx, 26, rx, 102); // Vertical plate seam
      for (let ry = 30; ry <= 98; ry += 12) {
        dreadGfx.fillStyle(0xd97724, 1);
        dreadGfx.fillCircle(rx, ry, 1.8);
        dreadGfx.fillStyle(0xfde68a, 0.9);
        dreadGfx.fillCircle(rx - 0.5, ry - 0.5, 0.8);
      }
    }

    // Imperial Gold Filigree on Ram Prow
    dreadGfx.lineStyle(2, 0xf59e0b, 0.95);
    dreadGfx.beginPath();
    dreadGfx.moveTo(14, 64); dreadGfx.lineTo(44, 46); dreadGfx.lineTo(64, 52);
    dreadGfx.strokePath();
    dreadGfx.beginPath();
    dreadGfx.moveTo(14, 64); dreadGfx.lineTo(44, 82); dreadGfx.lineTo(64, 76);
    dreadGfx.strokePath();

    // Triple Heavy Siege Mortar Batteries
    // 1. Dorsal Mortar
    dreadGfx.fillStyle(0x7f1d1d, 1);
    dreadGfx.fillRect(44, 30, 28, 12);
    dreadGfx.lineStyle(2, 0xfacc15, 1);
    dreadGfx.strokeRect(44, 30, 28, 12);
    dreadGfx.fillStyle(0x334155, 1);
    dreadGfx.fillRect(22, 33, 24, 6);
    dreadGfx.fillStyle(0xf8fafc, 1);
    dreadGfx.fillRect(18, 32, 5, 8); // Muzzle brake

    // 2. Center Spinal Mass Driver
    dreadGfx.fillStyle(0x450a0a, 1);
    dreadGfx.fillRect(36, 58, 32, 12);
    dreadGfx.lineStyle(2, 0xef4444, 1);
    dreadGfx.strokeRect(36, 58, 32, 12);
    dreadGfx.fillStyle(0x1e293b, 1);
    dreadGfx.fillRect(14, 61, 24, 6);
    dreadGfx.fillStyle(0xf8fafc, 1);
    dreadGfx.fillRect(10, 60, 5, 8);

    // 3. Ventral Mortar
    dreadGfx.fillStyle(0x7f1d1d, 1);
    dreadGfx.fillRect(44, 86, 28, 12);
    dreadGfx.lineStyle(2, 0xfacc15, 1);
    dreadGfx.strokeRect(44, 86, 28, 12);
    dreadGfx.fillStyle(0x334155, 1);
    dreadGfx.fillRect(22, 89, 24, 6);
    dreadGfx.fillStyle(0xf8fafc, 1);
    dreadGfx.fillRect(18, 88, 5, 8);

    // Recessed Crimson Broadside Gun Ports
    const portsY = [44, 54, 74, 84];
    for (const py of portsY) {
      dreadGfx.fillStyle(0x090d16, 1);
      dreadGfx.fillRect(94, py - 3, 14, 6);
      dreadGfx.fillStyle(0xef4444, 0.95);
      dreadGfx.fillRect(96, py - 1.5, 6, 3);
    }

    // Imperial Observation Citadel Bridge Tower (Elevated Command Deck)
    dreadGfx.fillStyle(0x1e293b, 1);
    dreadGfx.fillRect(116, 46, 38, 24);
    dreadGfx.lineStyle(2, 0xef4444, 1);
    dreadGfx.strokeRect(116, 46, 38, 24);

    // Menacing Crimson Command Slits (Lit from inside)
    dreadGfx.fillStyle(0xef4444, 1);
    dreadGfx.fillRect(120, 52, 28, 4);
    dreadGfx.fillStyle(0xfde047, 1);
    dreadGfx.fillRect(124, 53, 12, 2);

    // Heavy Comms Spire & Strobe Beacons
    dreadGfx.lineStyle(2, 0x94a3b8, 1);
    dreadGfx.lineBetween(135, 46, 135, 26);
    dreadGfx.lineBetween(120, 46, 120, 32);
    dreadGfx.fillStyle(0xef4444, 1);
    dreadGfx.fillCircle(135, 26, 2.5); // Crimson masthead beacon
    dreadGfx.fillCircle(120, 32, 2);

    dreadGfx.generateTexture('ship_enemy_dreadnought', 216 * s, 128 * s);
    dreadGfx.destroy();
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

    // 1. fx_spark (8x8 logical -> 16x16 at 2x): Core white with golden corona
    const sparkGfx = this.make.graphics({ x: 0, y: 0 }, false);
    sparkGfx.setScale(s);
    sparkGfx.fillStyle(0xfde68a, 0.4);
    sparkGfx.fillCircle(4, 4, 4);
    sparkGfx.fillStyle(0xfacc15, 0.85);
    sparkGfx.fillCircle(4, 4, 2.5);
    sparkGfx.fillStyle(0xffffff, 1);
    sparkGfx.fillCircle(4, 4, 1.2);
    sparkGfx.generateTexture('fx_spark', 8 * s, 8 * s);
    sparkGfx.destroy();

    // 2. fx_plasma_flare (16x16 logical): Smooth radial golden/amber plasma plume
    const flareGfx = this.make.graphics({ x: 0, y: 0 }, false);
    flareGfx.setScale(s);
    flareGfx.fillStyle(0xe09f3e, 0.2);
    flareGfx.fillCircle(8, 8, 8);
    flareGfx.fillStyle(0xf59e0b, 0.55);
    flareGfx.fillCircle(8, 8, 5.5);
    flareGfx.fillStyle(0xfef08a, 0.9);
    flareGfx.fillCircle(8, 8, 3);
    flareGfx.fillStyle(0xffffff, 1);
    flareGfx.fillCircle(8, 8, 1.5);
    flareGfx.generateTexture('fx_plasma_flare', 16 * s, 16 * s);
    flareGfx.destroy();

    // 3. fx_ion_flare (16x16 logical): Smooth radial cyan/electric blue ion plume
    const ionGfx = this.make.graphics({ x: 0, y: 0 }, false);
    ionGfx.setScale(s);
    ionGfx.fillStyle(0x0284c7, 0.2);
    ionGfx.fillCircle(8, 8, 8);
    ionGfx.fillStyle(0x38bdf8, 0.55);
    ionGfx.fillCircle(8, 8, 5.5);
    ionGfx.fillStyle(0xbae6fd, 0.9);
    ionGfx.fillCircle(8, 8, 3);
    ionGfx.fillStyle(0xffffff, 1);
    ionGfx.fillCircle(8, 8, 1.5);
    ionGfx.generateTexture('fx_ion_flare', 16 * s, 16 * s);
    ionGfx.destroy();

    // 4. fx_smoke (20x20 logical): Soft expanding cloud puff
    const smokeGfx = this.make.graphics({ x: 0, y: 0 }, false);
    smokeGfx.setScale(s);
    smokeGfx.fillStyle(0x475569, 0.25);
    smokeGfx.fillCircle(10, 10, 9);
    smokeGfx.fillStyle(0x64748b, 0.4);
    smokeGfx.fillCircle(10, 10, 6);
    smokeGfx.generateTexture('fx_smoke', 20 * s, 20 * s);
    smokeGfx.destroy();

    // 5. fx_slash_arc (40x40 logical): Curved kinetic plasma crescent for Parang Snap
    const slashGfx = this.make.graphics({ x: 0, y: 0 }, false);
    slashGfx.setScale(s);
    slashGfx.lineStyle(4, 0xe09f3e, 0.4);
    slashGfx.beginPath();
    slashGfx.arc(20, 20, 15, Phaser.Math.DegToRad(220), Phaser.Math.DegToRad(320), false);
    slashGfx.strokePath();
    slashGfx.lineStyle(2.5, 0xf59e0b, 0.85);
    slashGfx.beginPath();
    slashGfx.arc(20, 20, 15, Phaser.Math.DegToRad(225), Phaser.Math.DegToRad(315), false);
    slashGfx.strokePath();
    slashGfx.lineStyle(1.2, 0xffffff, 1);
    slashGfx.beginPath();
    slashGfx.arc(20, 20, 15, Phaser.Math.DegToRad(230), Phaser.Math.DegToRad(310), false);
    slashGfx.strokePath();
    slashGfx.generateTexture('fx_slash_arc', 40 * s, 40 * s);
    slashGfx.destroy();

    // 6. fx_laser_bolt (32x8 logical): Supersonic laser needle with neon edge
    const boltGfx = this.make.graphics({ x: 0, y: 0 }, false);
    boltGfx.setScale(s);
    boltGfx.fillStyle(0x38bdf8, 0.3);
    boltGfx.fillRoundedRect(0, 0, 32, 8, 4);
    boltGfx.fillStyle(0x7dd3fc, 0.8);
    boltGfx.fillRoundedRect(4, 1.5, 24, 5, 2.5);
    boltGfx.fillStyle(0xffffff, 1);
    boltGfx.fillRoundedRect(8, 2.5, 16, 3, 1.5);
    boltGfx.generateTexture('fx_laser_bolt', 32 * s, 8 * s);
    boltGfx.destroy();

    // 7. fx_dust_mote (6x6 logical): Microscopic drifting space dust
    const dustGfx = this.make.graphics({ x: 0, y: 0 }, false);
    dustGfx.setScale(s);
    dustGfx.fillStyle(0xfde68a, 0.35);
    dustGfx.fillCircle(3, 3, 3);
    dustGfx.fillStyle(0xffffff, 0.8);
    dustGfx.fillCircle(3, 3, 1.5);
    dustGfx.generateTexture('fx_dust_mote', 6 * s, 6 * s);
    dustGfx.destroy();

    // 8. fx_shockwave (48x48 logical): Concentric energy ripple
    const shockGfx = this.make.graphics({ x: 0, y: 0 }, false);
    shockGfx.setScale(s);
    shockGfx.lineStyle(2, 0x38bdf8, 0.8);
    shockGfx.strokeCircle(24, 24, 20);
    shockGfx.lineStyle(1, 0xffffff, 0.95);
    shockGfx.strokeCircle(24, 24, 18);
    shockGfx.generateTexture('fx_shockwave', 48 * s, 48 * s);
    shockGfx.destroy();
  }
}
