import { Card, Contract, Enemy, EnemyIntent, GameState } from '../types/game';

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

export const ENEMY_INTENT_POOL: EnemyIntent[] = [
  {
    id: 'CARGO_SCAN',
    name: 'Cargo Scan',
    value: 15,
    description: 'Customs scanners sweep cargo: +15% Heat',
    badgeText: 'CARGO SCAN (+15% HEAT)',
  },
  {
    id: 'WARNING_SHOT',
    name: 'Warning Shot',
    value: 7,
    description: 'Solid slug across prow: 7 DMG',
    badgeText: 'WARNING SHOT (7 DMG)',
  },
  {
    id: 'BROADSIDE',
    name: 'Broadside',
    value: 11,
    description: 'Full naval cannon battery: 11 DMG',
    badgeText: 'BROADSIDE (11 DMG)',
  },
  {
    id: 'REINFORCE_HULL',
    name: 'Reinforce Hull',
    value: 8,
    description: 'Armors prow bulkhead: +8 Shield',
    badgeText: 'REINFORCE (+8 SHIELD)',
  },
];

export function createAllianceCutter(): Enemy {
  const intents = ENEMY_INTENT_POOL.map((intent) => ({ ...intent, cancelled: false }));
  return {
    id: 'enemy_alliance_customs_cutter',
    name: 'Alliance Rajah Cutter',
    subtitle: 'BORNEO SECTOR BORDER INTERCEPTOR',
    hull: 48,
    maxHull: 48,
    shield: 0,
    intents,
    intentIndex: 0,
    currentIntent: { ...intents[0] },
  };
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
