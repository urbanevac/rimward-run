import {
  BlackMarketItem,
  Card,
  Contract,
  Enemy,
  EnemyIntent,
  GameState,
  SectorInfo,
} from '../types/game';

export const INITIAL_PLAYER_STATE: GameState = {
  hull: 30,
  maxHull: 30,
  evasion: 0,
  fuel: 8,
  credits: 65,
  heat: 25,
  maxHeat: 100,
  ap: 3,
  maxAp: 3,
};

export const ACTIVE_CONTRACT_SEED: Contract = {
  id: 'contract_sarikei_gold',
  name: 'The Sarikei Run',
  cargoName: 'Sarikei Black Gold',
  payout: 120,
  contrabandCount: 2,
  voided: false,
};

export const SECTORS_DATA: SectorInfo[] = [
  {
    number: 1,
    maxSectors: 3,
    name: 'Santubong Shallows',
    subname: 'OUTER ATOLL PATROL CORRIDOR',
    marketName: 'Kuching Waterfront Depot',
  },
  {
    number: 2,
    maxSectors: 3,
    name: 'Pelagus Rapids',
    subname: 'ASTEROID RIVER CHOKEPOINT',
    marketName: 'Kapit River Outpost',
  },
  {
    number: 3,
    maxSectors: 3,
    name: 'Bario Blockade',
    subname: 'COLONIAL HIGHLAND GARRISON',
    marketName: 'Bario Free Station',
  },
];

export function createEnemyForSector(sectorNumber: number): Enemy {
  switch (sectorNumber) {
    case 1: {
      const intents: EnemyIntent[] = [
        {
          id: 'CARGO_SCAN',
          name: 'Cargo Scan',
          value: 15,
          description: 'Sensors sweep cargo hold: +15% Heat',
          badgeText: 'CARGO SCAN (+15% HEAT)',
          cancelled: false,
        },
        {
          id: 'WARNING_SHOT',
          name: 'Warning Shot',
          value: 6,
          description: 'Twin light laser pulse: 6 DMG',
          badgeText: 'WARNING SHOT (6 DMG)',
          cancelled: false,
        },
        {
          id: 'REINFORCE_HULL',
          name: 'Reinforce Hull',
          value: 6,
          description: 'Deploys light shield: +6 Shield',
          badgeText: 'REINFORCE (+6 SHIELD)',
          cancelled: false,
        },
        {
          id: 'WARNING_SHOT',
          name: 'Warning Shot',
          value: 6,
          description: 'Twin light laser pulse: 6 DMG',
          badgeText: 'WARNING SHOT (6 DMG)',
          cancelled: false,
        },
      ];
      return {
        id: 'enemy_patrol_skiff',
        name: 'Customs Patrol Skiff',
        subtitle: 'IAV-102 LIGHT RECON SKIFF',
        spriteKey: 'ship_enemy_skiff',
        hull: 36,
        maxHull: 36,
        shield: 0,
        intents,
        intentIndex: 0,
        currentIntent: { ...intents[0] },
      };
    }
    case 2: {
      const intents: EnemyIntent[] = [
        {
          id: 'CARGO_SCAN',
          name: 'Cargo Scan',
          value: 15,
          description: 'Customs scanners sweep cargo: +15% Heat',
          badgeText: 'CARGO SCAN (+15% HEAT)',
          cancelled: false,
        },
        {
          id: 'WARNING_SHOT',
          name: 'Warning Shot',
          value: 7,
          description: 'Solid slug across prow: 7 DMG',
          badgeText: 'WARNING SHOT (7 DMG)',
          cancelled: false,
        },
        {
          id: 'BROADSIDE',
          name: 'Broadside',
          value: 11,
          description: 'Full naval cannon battery: 11 DMG',
          badgeText: 'BROADSIDE (11 DMG)',
          cancelled: false,
        },
        {
          id: 'REINFORCE_HULL',
          name: 'Reinforce Hull',
          value: 8,
          description: 'Armors prow bulkhead: +8 Shield',
          badgeText: 'REINFORCE (+8 SHIELD)',
          cancelled: false,
        },
      ];
      return {
        id: 'enemy_alliance_customs_cutter',
        name: 'Alliance Rajah Cutter',
        subtitle: 'IAV-404 BORDER CRUISER',
        spriteKey: 'ship_enemy_cutter',
        hull: 48,
        maxHull: 48,
        shield: 0,
        intents,
        intentIndex: 0,
        currentIntent: { ...intents[0] },
      };
    }
    case 3:
    default: {
      const intents: EnemyIntent[] = [
        {
          id: 'LOCKDOWN_SCAN',
          name: 'Lockdown Scan',
          value: 20,
          description: 'Imperial lockdown beam: +20% Heat',
          badgeText: 'LOCKDOWN (+20% HEAT)',
          cancelled: false,
        },
        {
          id: 'BROADSIDE',
          name: 'Twin Mortar Barrage',
          value: 14,
          description: 'Heavy casemate mortars: 14 DMG',
          badgeText: 'MORTAR BARRAGE (14 DMG)',
          cancelled: false,
        },
        {
          id: 'REINFORCE_HULL',
          name: 'Reinforce Ironclad',
          value: 12,
          description: 'Overcharges armored plating: +12 Shield',
          badgeText: 'IRONCLAD WALL (+12 SHD)',
          cancelled: false,
        },
        {
          id: 'BROADSIDE',
          name: 'Broadside Cannonade',
          value: 12,
          description: 'Full flagship broadside: 12 DMG',
          badgeText: 'BROADSIDE (12 DMG)',
          cancelled: false,
        },
      ];
      return {
        id: 'enemy_brooke_dreadnought',
        name: 'Brooke Dreadnought',
        subtitle: 'FLAGSHIP RAJAH-V DREADNOUGHT',
        spriteKey: 'ship_enemy_dreadnought',
        hull: 65,
        maxHull: 65,
        shield: 10,
        intents,
        intentIndex: 0,
        currentIntent: { ...intents[0] },
      };
    }
  }
}

// Backward-compatibility wrapper
export function createAllianceCutter(): Enemy {
  return createEnemyForSector(2);
}

export function getBlackMarketItemsForSector(sectorNumber: number): BlackMarketItem[] {
  const baseItems: BlackMarketItem[] = [
    {
      id: 'repair_10',
      name: 'Belian Hull Patch',
      cost: 25,
      description: 'Restore +10 Hull to ship.',
      icon: '🔧',
      type: 'repair',
    },
    {
      id: 'cool_25',
      name: 'Bribe Customs Dispatcher',
      cost: 25,
      description: 'Cool Heat signature by -25%.',
      icon: '🧊',
      type: 'cool',
    },
    {
      id: 'fuel_2',
      name: 'Refuel Hyperdrive Cell',
      cost: 20,
      description: 'Add +2 Fuel for future jumps.',
      icon: '⛽',
      type: 'fuel',
    },
  ];

  if (sectorNumber === 1) {
    baseItems.push({
      id: 'card_terabai',
      name: 'Recruit: Terabai Bastion',
      cost: 40,
      description: 'Pilot card: +9 Evasion & Draw 1 card.',
      icon: '🛡️',
      type: 'card',
      cardTemplateId: 'terabai_bastion',
    });
  } else {
    baseItems.push({
      id: 'card_dive',
      name: 'Recruit: Kenyalang Dive',
      cost: 40,
      description: 'Mercenary card: 12 DMG (Fatal: -10% Heat).',
      icon: '🦅',
      type: 'card',
      cardTemplateId: 'kenyalang_dive',
    });
  }

  return baseItems;
}

export function createStarterCrewDeck(): Card[] {
  const cards: Omit<Card, 'instanceId'>[] = [
    // 3x Parang Snap (Mercenary - 1 AP): Deal 6 damage.
    {
      templateId: 'parang_snap',
      title: 'Parang Snap',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Kinetic blade slash.\nDeal 6 DMG.',
      iconKey: 'icon_parang',
    },
    {
      templateId: 'parang_snap',
      title: 'Parang Snap',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Kinetic blade slash.\nDeal 6 DMG.',
      iconKey: 'icon_parang',
    },
    {
      templateId: 'parang_snap',
      title: 'Parang Snap',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Kinetic blade slash.\nDeal 6 DMG.',
      iconKey: 'icon_parang',
    },

    // 2x Sumpit Dart (Mercenary - 2 AP): Deal 14 damage. Fatal: -10% Heat.
    {
      templateId: 'sumpit_dart',
      title: 'Sumpit Dart',
      type: 'Mercenary',
      apCost: 2,
      damage: 14,
      onKillHeatDelta: -10,
      description: 'Silent Upas dart.\n14 DMG. Fatal: -10% Heat.',
      iconKey: 'icon_sumpit',
    },
    {
      templateId: 'sumpit_dart',
      title: 'Sumpit Dart',
      type: 'Mercenary',
      apCost: 2,
      damage: 14,
      onKillHeatDelta: -10,
      description: 'Silent Upas dart.\n14 DMG. Fatal: -10% Heat.',
      iconKey: 'icon_sumpit',
    },

    // 3x Rapid Skim (Pilot - 1 AP): Gain 6 Evasion.
    {
      templateId: 'rapid_skim',
      title: 'Rapid Skim',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Shallow river draft.\nGain +6 Evasion.',
      iconKey: 'icon_rapid_skim',
    },
    {
      templateId: 'rapid_skim',
      title: 'Rapid Skim',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Shallow river draft.\nGain +6 Evasion.',
      iconKey: 'icon_rapid_skim',
    },
    {
      templateId: 'rapid_skim',
      title: 'Rapid Skim',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Shallow river draft.\nGain +6 Evasion.',
      iconKey: 'icon_rapid_skim',
    },

    // 2x Rajang Whirlpool (Pilot - 2 AP): Gain 10 Evasion and deal 5 damage.
    {
      templateId: 'rajang_whirlpool',
      title: 'Rajang Whirlpool',
      type: 'Pilot',
      apCost: 2,
      evasion: 10,
      damage: 5,
      description: 'Pelagus rapids spin.\n+10 Evasion • 5 DMG.',
      iconKey: 'icon_rajang',
    },
    {
      templateId: 'rajang_whirlpool',
      title: 'Rajang Whirlpool',
      type: 'Pilot',
      apCost: 2,
      evasion: 10,
      damage: 5,
      description: 'Pelagus rapids spin.\n+10 Evasion • 5 DMG.',
      iconKey: 'icon_rajang',
    },

    // 1x Rattan Lashing (Mechanic - 1 AP): Restore 4 Hull and draw 1 card.
    {
      templateId: 'rattan_lashing',
      title: 'Rattan Lashing',
      type: 'Mechanic',
      apCost: 1,
      healHull: 4,
      drawCards: 1,
      description: 'Braided jungle weave.\n+4 Hull • Draw 1 card.',
      iconKey: 'icon_rattan',
    },

    // 1x Haggling at Bazaar (Captain - 1 AP): Spend 15 Credits to cancel the enemy's current Intent.
    {
      templateId: 'haggling_bazaar',
      title: 'Bazaar Haggling',
      type: 'Captain',
      apCost: 1,
      creditCost: 15,
      cancelIntent: true,
      description: 'Waterfront barter.\nPay 15 Cr: Jam Intent.',
      iconKey: 'icon_haggling',
    },
  ];

  return cards.map((card, index) => ({
    ...card,
    instanceId: `crew_${card.templateId}_${index + 1}`,
  }));
}

export function createEliteCard(templateId: 'terabai_bastion' | 'kenyalang_dive', instanceIndex = 1): Card {
  if (templateId === 'terabai_bastion') {
    return {
      instanceId: `elite_terabai_bastion_${instanceIndex}`,
      templateId: 'terabai_bastion',
      title: 'Terabai Bastion',
      type: 'Pilot',
      apCost: 1,
      evasion: 9,
      drawCards: 1,
      description: 'Ancestral shield.\n+9 Evasion • Draw 1 card.',
      iconKey: 'icon_terabai',
    };
  }

  return {
    instanceId: `elite_kenyalang_dive_${instanceIndex}`,
    templateId: 'kenyalang_dive',
    title: 'Kenyalang Dive',
    type: 'Mercenary',
    apCost: 2,
    damage: 12,
    onKillHeatDelta: -10,
    description: 'Hornbill kinetic plunge.\n12 DMG. Fatal: -10% Heat.',
    iconKey: 'icon_parang',
  };
}

export function createContrabandCards(count = 2): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      instanceId: `contraband_sarikei_gold_${i + 1}`,
      templateId: 'sarikei_black_gold',
      title: 'Sarikei Gold',
      type: 'Contraband',
      apCost: 0,
      unplayable: true,
      endTurnHeatPenalty: 10,
      description: 'UNPLAYABLE\nEnd Turn: +10% Heat\nAIRLOCK: 0 AP',
      iconKey: 'icon_pepper',
    });
  }
  return cards;
}
