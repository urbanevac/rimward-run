export type CardType = 'Mercenary' | 'Pilot' | 'Mechanic' | 'Captain' | 'Contraband';

export type CardTemplateId =
  | 'quick_draw'
  | 'veras_whisper'
  | 'evasive_burn'
  | 'crazy_ivan'
  | 'duct_tape_bypass'
  | 'fast_talk'
  | 'hot_stims';

export interface Card {
  instanceId: string;
  templateId: CardTemplateId;
  title: string;
  type: CardType;
  apCost: number;
  creditCost?: number;
  unplayable?: boolean;
  damage?: number;
  evasion?: number;
  healHull?: number;
  drawCards?: number;
  cancelIntent?: boolean;
  onKillHeatDelta?: number;
  endTurnHeatPenalty?: number;
  description: string;
  iconKey: string;
}

export type EnemyIntentType = 'CARGO_SCAN' | 'WARNING_SHOT' | 'BROADSIDE' | 'REINFORCE_HULL';

export interface EnemyIntent {
  id: EnemyIntentType;
  name: string;
  value: number;
  description: string;
  badgeText: string;
  cancelled?: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  subtitle: string;
  hull: number;
  maxHull: number;
  shield: number;
  intents: EnemyIntent[];
  intentIndex: number;
  currentIntent: EnemyIntent;
}

export interface Contract {
  id: string;
  name: string;
  cargoName: string;
  payout: number;
  contrabandCount: number;
  voided: boolean;
}

export interface GameState {
  hull: number;
  maxHull: number;
  evasion: number;
  fuel: number;
  credits: number;
  heat: number;
  maxHeat: number;
  ap: number;
  maxAp: number;
}

export type CombatOutcome = 'ONGOING' | 'VICTORY' | 'DEFEAT_HULL' | 'DEFEAT_HEAT';

export interface CombatState {
  turn: number;
  player: GameState;
  enemy: Enemy;
  contract: Contract;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  lastLog: string;
  outcome: CombatOutcome;
  creditsEarnedThisRun: number;
}

export interface PlayCardResult {
  success: boolean;
  reason?: string;
  card?: Card;
  damageToShield: number;
  damageToHull: number;
  evasionGained: number;
  hullRestored: number;
  cardsDrawn: number;
  creditsSpent: number;
  heatDelta: number;
  cancelledIntent: boolean;
  killedEnemy: boolean;
  logMessage: string;
}

export interface EndTurnResult {
  contrabandCount: number;
  contrabandHeatAdded: number;
  enemyIntentExecuted: EnemyIntent;
  enemyDamageDealt: number;
  damageAbsorbedByEvasion: number;
  hullDamageTaken: number;
  enemyShieldGained: number;
  enemyHeatAdded: number;
  outcome: CombatOutcome;
  logMessage: string;
}
