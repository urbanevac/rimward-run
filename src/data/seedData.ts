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
  id: 'contract_unregistered_stims',
  name: 'Unregistered Stims',
  cargoName: 'Hot Stims',
  payout: 120,
  contrabandCount: 2,
  voided: false,
};

export const ENEMY_INTENT_POOL: EnemyIntent[] = [
  {
    id: 'CARGO_SCAN',
    name: 'Cargo Scan',
    value: 15,
    description: 'Sweeps your hold: +15% Heat',
    badgeText: 'CARGO SCAN (+15% HEAT)',
  },
  {
    id: 'WARNING_SHOT',
    name: 'Warning Shot',
    value: 7,
    description: 'Fires across bow: 7 DMG',
    badgeText: 'WARNING SHOT (7 DMG)',
  },
  {
    id: 'BROADSIDE',
    name: 'Broadside',
    value: 11,
    description: 'Full cannon volley: 11 DMG',
    badgeText: 'BROADSIDE (11 DMG)',
  },
  {
    id: 'REINFORCE_HULL',
    name: 'Reinforce Hull',
    value: 8,
    description: 'Raises plating: +8 Shield',
    badgeText: 'REINFORCE (+8 SHIELD)',
  },
];

export function createAllianceCutter(): Enemy {
  const intents = ENEMY_INTENT_POOL.map((intent) => ({ ...intent, cancelled: false }));
  return {
    id: 'enemy_alliance_customs_cutter',
    name: 'Alliance Customs Cutter',
    subtitle: 'IAV-404 BORDER INTERCEPTOR',
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
    // 3x Quick Draw (Mercenary - 1 AP): Deal 6 damage.
    {
      templateId: 'quick_draw',
      title: 'Quick Draw',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Deal 6 DMG to enemy.',
      iconKey: 'icon_blaster',
    },
    {
      templateId: 'quick_draw',
      title: 'Quick Draw',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Deal 6 DMG to enemy.',
      iconKey: 'icon_blaster',
    },
    {
      templateId: 'quick_draw',
      title: 'Quick Draw',
      type: 'Mercenary',
      apCost: 1,
      damage: 6,
      description: 'Deal 6 DMG to enemy.',
      iconKey: 'icon_blaster',
    },

    // 2x Vera's Whisper (Mercenary - 2 AP): Deal 14 damage. If this defeats the enemy, reduce Heat by 10%.
    {
      templateId: 'veras_whisper',
      title: "Vera's Whisper",
      type: 'Mercenary',
      apCost: 2,
      damage: 14,
      onKillHeatDelta: -10,
      description: 'Deal 14 DMG.\nFatal: -10% Heat.',
      iconKey: 'icon_rifle',
    },
    {
      templateId: 'veras_whisper',
      title: "Vera's Whisper",
      type: 'Mercenary',
      apCost: 2,
      damage: 14,
      onKillHeatDelta: -10,
      description: 'Deal 14 DMG.\nFatal: -10% Heat.',
      iconKey: 'icon_rifle',
    },

    // 3x Evasive Burn (Pilot - 1 AP): Gain 6 Evasion.
    {
      templateId: 'evasive_burn',
      title: 'Evasive Burn',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Gain +6\nEvasion.',
      iconKey: 'icon_thruster',
    },
    {
      templateId: 'evasive_burn',
      title: 'Evasive Burn',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Gain +6\nEvasion.',
      iconKey: 'icon_thruster',
    },
    {
      templateId: 'evasive_burn',
      title: 'Evasive Burn',
      type: 'Pilot',
      apCost: 1,
      evasion: 6,
      description: 'Gain +6\nEvasion.',
      iconKey: 'icon_thruster',
    },

    // 2x Crazy Ivan (Pilot - 2 AP): Gain 10 Evasion and deal 5 damage.
    {
      templateId: 'crazy_ivan',
      title: 'Crazy Ivan',
      type: 'Pilot',
      apCost: 2,
      evasion: 10,
      damage: 5,
      description: 'Gain +10 Evasion.\nDeal 5 DMG.',
      iconKey: 'icon_maneuver',
    },
    {
      templateId: 'crazy_ivan',
      title: 'Crazy Ivan',
      type: 'Pilot',
      apCost: 2,
      evasion: 10,
      damage: 5,
      description: 'Gain +10 Evasion.\nDeal 5 DMG.',
      iconKey: 'icon_maneuver',
    },

    // 1x Duct-Tape Bypass (Mechanic - 1 AP): Restore 4 Hull and draw 1 card.
    {
      templateId: 'duct_tape_bypass',
      title: 'Duct-Tape Bypass',
      type: 'Mechanic',
      apCost: 1,
      healHull: 4,
      drawCards: 1,
      description: 'Restore 4 Hull.\nDraw 1 card.',
      iconKey: 'icon_wrench',
    },

    // 1x Fast Talk (Captain - 1 AP): Spend 15 Credits to cancel the enemy's current Intent for this turn.
    {
      templateId: 'fast_talk',
      title: 'Fast Talk',
      type: 'Captain',
      apCost: 1,
      creditCost: 15,
      cancelIntent: true,
      description: 'Pay 15 Cr:\nCancel enemy\nIntent.',
      iconKey: 'icon_comms',
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
      instanceId: `contraband_hot_stims_${i + 1}`,
      templateId: 'hot_stims',
      title: 'Hot Stims',
      type: 'Contraband',
      apCost: 0,
      unplayable: true,
      endTurnHeatPenalty: 10,
      description: 'UNPLAYABLE\nEnd Turn: +10% Heat\nAIRLOCK: 0 AP',
      iconKey: 'icon_contraband',
    });
  }
  return cards;
}
