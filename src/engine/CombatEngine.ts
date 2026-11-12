import {
  ACTIVE_CONTRACT_SEED,
  INITIAL_PLAYER_STATE,
  createAllianceCutter,
  createContrabandCards,
  createStarterCrewDeck,
} from '../data/seedData';
import {
  Card,
  CombatState,
  EndTurnResult,
  PlayCardResult,
} from '../types/game';

export class CombatEngine {
  private state: CombatState;
  private readonly handSize = 4;

  constructor() {
    this.state = this.createInitialState();
    this.drawCards(this.handSize);
  }

  private createInitialState(): CombatState {
    const crewDeck = createStarterCrewDeck();
    const contraband = createContrabandCards(ACTIVE_CONTRACT_SEED.contrabandCount);
    const fullDeck = this.shuffle([...crewDeck, ...contraband]);

    return {
      turn: 1,
      player: { ...INITIAL_PLAYER_STATE },
      enemy: createAllianceCutter(),
      contract: { ...ACTIVE_CONTRACT_SEED },
      drawPile: fullDeck,
      hand: [],
      discardPile: [],
      exhaustPile: [],
      lastLog: 'Alliance Cutter has locked on. Prepare for inspection!',
      outcome: 'ONGOING',
      creditsEarnedThisRun: 0,
    };
  }

  public resetEncounter(): CombatState {
    this.state = this.createInitialState();
    this.drawCards(this.handSize);
    return this.getState();
  }

  public getState(): CombatState {
    return {
      ...this.state,
      player: { ...this.state.player },
      enemy: {
        ...this.state.enemy,
        intents: this.state.enemy.intents.map((i) => ({ ...i })),
        currentIntent: { ...this.state.enemy.currentIntent },
      },
      contract: { ...this.state.contract },
      drawPile: [...this.state.drawPile],
      hand: [...this.state.hand],
      discardPile: [...this.state.discardPile],
      exhaustPile: [...this.state.exhaustPile],
    };
  }

  private shuffle(cards: Card[]): Card[] {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  public drawCards(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (this.state.drawPile.length === 0) {
        if (this.state.discardPile.length === 0) {
          break;
        }
        this.state.drawPile = this.shuffle(this.state.discardPile);
        this.state.discardPile = [];
      }
      const nextCard = this.state.drawPile.pop();
      if (nextCard) {
        this.state.hand.push(nextCard);
        drawn.push(nextCard);
      }
    }
    return drawn;
  }

  public canPlayCard(instanceId: string): { playable: boolean; reason?: string } {
    if (this.state.outcome !== 'ONGOING') {
      return { playable: false, reason: 'Combat has ended.' };
    }
    const card = this.state.hand.find((c) => c.instanceId === instanceId);
    if (!card) {
      return { playable: false, reason: 'Card not in hand.' };
    }
    if (card.unplayable || card.type === 'Contraband') {
      return { playable: false, reason: 'Contraband cannot be played! Drag to AIRLOCK to jettison.' };
    }
    if (this.state.player.ap < card.apCost) {
      return { playable: false, reason: `Not enough AP (Need ${card.apCost} AP).` };
    }
    if (card.creditCost && this.state.player.credits < card.creditCost) {
      return { playable: false, reason: `Need ${card.creditCost} Credits!` };
    }
    if (card.cancelIntent && this.state.enemy.currentIntent.cancelled) {
      return { playable: false, reason: 'Enemy intent already jammed this turn!' };
    }
    return { playable: true };
  }

  public playCard(instanceId: string): PlayCardResult {
    const check = this.canPlayCard(instanceId);
    if (!check.playable) {
      return {
        success: false,
        reason: check.reason,
        damageToShield: 0,
        damageToHull: 0,
        evasionGained: 0,
        hullRestored: 0,
        cardsDrawn: 0,
        creditsSpent: 0,
        heatDelta: 0,
        cancelledIntent: false,
        killedEnemy: false,
        logMessage: check.reason ?? 'Cannot play card.',
      };
    }

    const cardIndex = this.state.hand.findIndex((c) => c.instanceId === instanceId);
    const [card] = this.state.hand.splice(cardIndex, 1);

    // Spend AP and Credits
    this.state.player.ap -= card.apCost;
    let creditsSpent = 0;
    if (card.creditCost) {
      this.state.player.credits -= card.creditCost;
      creditsSpent = card.creditCost;
    }

    let damageToShield = 0;
    let damageToHull = 0;
    let evasionGained = 0;
    let hullRestored = 0;
    let cardsDrawn = 0;
    let heatDelta = 0;
    let cancelledIntent = false;
    let killedEnemy = false;

    const logParts: string[] = [`Played ${card.title}`];

    // Deal damage (absorbs enemy shield first)
    if (card.damage && card.damage > 0) {
      let remainingDamage = card.damage;
      if (this.state.enemy.shield > 0) {
        damageToShield = Math.min(this.state.enemy.shield, remainingDamage);
        this.state.enemy.shield -= damageToShield;
        remainingDamage -= damageToShield;
      }
      if (remainingDamage > 0) {
        damageToHull = Math.min(this.state.enemy.hull, remainingDamage);
        this.state.enemy.hull = Math.max(0, this.state.enemy.hull - remainingDamage);
      }
      logParts.push(`dealt ${card.damage} DMG`);
    }

    // Evasion
    if (card.evasion && card.evasion > 0) {
      this.state.player.evasion += card.evasion;
      evasionGained = card.evasion;
      logParts.push(`+${card.evasion} Evasion`);
    }

    // Heal Hull
    if (card.healHull && card.healHull > 0) {
      const before = this.state.player.hull;
      this.state.player.hull = Math.min(this.state.player.maxHull, this.state.player.hull + card.healHull);
      hullRestored = this.state.player.hull - before;
      logParts.push(`+${hullRestored} Hull`);
    }

    // Draw cards
    if (card.drawCards && card.drawCards > 0) {
      const newlyDrawn = this.drawCards(card.drawCards);
      cardsDrawn = newlyDrawn.length;
      logParts.push(`drew ${cardsDrawn} card${cardsDrawn === 1 ? '' : 's'}`);
    }

    // Cancel Enemy Intent
    if (card.cancelIntent) {
      this.state.enemy.currentIntent.cancelled = true;
      cancelledIntent = true;
      logParts.push(`jammed ${this.state.enemy.currentIntent.name} (-${creditsSpent} Cr)`);
    }

    // Check enemy defeat & onKillHeatDelta (Vera's Whisper)
    if (this.state.enemy.hull <= 0) {
      killedEnemy = true;
      if (card.onKillHeatDelta) {
        const prevHeat = this.state.player.heat;
        this.state.player.heat = Math.max(0, Math.min(this.state.player.maxHeat, this.state.player.heat + card.onKillHeatDelta));
        heatDelta = this.state.player.heat - prevHeat;
        logParts.push(`Fatal shot cooled Heat by ${Math.abs(card.onKillHeatDelta)}%`);
      }

      // Resolve Victory & Contract payout
      this.state.outcome = 'VICTORY';
      if (!this.state.contract.voided) {
        this.state.player.credits += this.state.contract.payout;
        this.state.creditsEarnedThisRun = this.state.contract.payout;
        logParts.push(`Cutter disabled! +${this.state.contract.payout} Cr contract payout!`);
      } else {
        this.state.creditsEarnedThisRun = 0;
        logParts.push('Cutter disabled! (Contract payout forfeited)');
      }
    }

    this.state.discardPile.push(card);

    const logMessage = logParts.join(' • ') + '.';
    this.state.lastLog = logMessage;

    return {
      success: true,
      card,
      damageToShield,
      damageToHull,
      evasionGained,
      hullRestored,
      cardsDrawn,
      creditsSpent,
      heatDelta,
      cancelledIntent,
      killedEnemy,
      logMessage,
    };
  }

  public jettisonCard(instanceId: string): {
    success: boolean;
    card?: Card;
    contractVoidedNow: boolean;
    logMessage: string;
  } {
    if (this.state.outcome !== 'ONGOING') {
      return {
        success: false,
        contractVoidedNow: false,
        logMessage: 'Combat has already ended.',
      };
    }

    const index = this.state.hand.findIndex((c) => c.instanceId === instanceId);
    if (index === -1) {
      return {
        success: false,
        contractVoidedNow: false,
        logMessage: 'Card not found in hand.',
      };
    }

    const card = this.state.hand[index];
    if (card.type !== 'Contraband') {
      return {
        success: false,
        contractVoidedNow: false,
        logMessage: 'Only Contraband cargo can be jettisoned out the Airlock!',
      };
    }

    this.state.hand.splice(index, 1);
    this.state.exhaustPile.push(card);

    const contractVoidedNow = !this.state.contract.voided;
    this.state.contract.voided = true;
    this.state.contract.contrabandCount = Math.max(0, this.state.contract.contrabandCount - 1);

    const logMessage = `Jettisoned ${card.title}! Contract voided (-${this.state.contract.payout} Cr).`;
    this.state.lastLog = logMessage;

    return {
      success: true,
      card,
      contractVoidedNow,
      logMessage,
    };
  }

  public endTurn(): EndTurnResult {
    // 1. Check contraband remaining in hand
    const contrabandInHand = this.state.hand.filter((c) => c.type === 'Contraband');
    let contrabandHeatAdded = 0;

    if (contrabandInHand.length > 0) {
      for (const c of contrabandInHand) {
        contrabandHeatAdded += c.endTurnHeatPenalty ?? 10;
      }
      this.state.player.heat = Math.min(
        this.state.player.maxHeat,
        this.state.player.heat + contrabandHeatAdded
      );
    }

    // Discard remaining hand into discardPile
    while (this.state.hand.length > 0) {
      const card = this.state.hand.pop();
      if (card) {
        this.state.discardPile.push(card);
      }
    }

    const executedIntent = { ...this.state.enemy.currentIntent };
    let enemyDamageDealt = 0;
    let damageAbsorbedByEvasion = 0;
    let hullDamageTaken = 0;
    let enemyShieldGained = 0;
    let enemyHeatAdded = 0;
    const logSegments: string[] = [];

    if (contrabandHeatAdded > 0) {
      logSegments.push(`${this.state.contract.cargoName} leaked +${contrabandHeatAdded}% Heat!`);
    }

    // If contraband pushed Heat to 100%, immediate defeat!
    if (this.state.player.heat >= this.state.player.maxHeat) {
      this.state.outcome = 'DEFEAT_HEAT';
      const msg = `${logSegments.join(' ')} Heat hit 100%! Alliance boarding clamps locked!`.trim();
      this.state.lastLog = msg;
      return {
        contrabandCount: contrabandInHand.length,
        contrabandHeatAdded,
        enemyIntentExecuted: executedIntent,
        enemyDamageDealt: 0,
        damageAbsorbedByEvasion: 0,
        hullDamageTaken: 0,
        enemyShieldGained: 0,
        enemyHeatAdded: 0,
        outcome: this.state.outcome,
        logMessage: msg,
      };
    }

    // 2. Execute Enemy Intent (unless cancelled by Fast Talk)
    if (executedIntent.cancelled) {
      logSegments.push(`Cutter's ${executedIntent.name} was jammed by Fast Talk!`);
    } else {
      switch (executedIntent.id) {
        case 'CARGO_SCAN': {
          enemyHeatAdded = executedIntent.value;
          this.state.player.heat = Math.min(
            this.state.player.maxHeat,
            this.state.player.heat + enemyHeatAdded
          );
          logSegments.push(`Cutter Cargo Scan: +${enemyHeatAdded}% Heat!`);
          break;
        }
        case 'WARNING_SHOT':
        case 'BROADSIDE': {
          enemyDamageDealt = executedIntent.value;
          damageAbsorbedByEvasion = Math.min(this.state.player.evasion, enemyDamageDealt);
          this.state.player.evasion -= damageAbsorbedByEvasion;
          hullDamageTaken = enemyDamageDealt - damageAbsorbedByEvasion;
          this.state.player.hull = Math.max(0, this.state.player.hull - hullDamageTaken);
          if (damageAbsorbedByEvasion > 0) {
            logSegments.push(
              `${executedIntent.name}: ${hullDamageTaken} Hull DMG (${damageAbsorbedByEvasion} evaded)!`
            );
          } else {
            logSegments.push(`${executedIntent.name}: ${hullDamageTaken} Hull DMG!`);
          }
          break;
        }
        case 'REINFORCE_HULL': {
          enemyShieldGained = executedIntent.value;
          this.state.enemy.shield += enemyShieldGained;
          logSegments.push(`Cutter Reinforced Hull (+${enemyShieldGained} Shield).`);
          break;
        }
      }
    }

    // 3. Check Defeat conditions
    if (this.state.player.hull <= 0) {
      this.state.outcome = 'DEFEAT_HULL';
      logSegments.push('Ship Hull breached!');
    } else if (this.state.player.heat >= this.state.player.maxHeat) {
      this.state.outcome = 'DEFEAT_HEAT';
      logSegments.push('Heat reached 100% — Boarded & Impounded!');
    } else {
      // 4. Advance to next Player Turn
      this.state.turn += 1;
      this.state.player.evasion = 0; // Evasion resets to 0 at start of player's turn
      this.state.player.ap = this.state.player.maxAp;

      // Cycle enemy intent
      this.state.enemy.intentIndex =
        (this.state.enemy.intentIndex + 1) % this.state.enemy.intents.length;
      this.state.enemy.currentIntent = {
        ...this.state.enemy.intents[this.state.enemy.intentIndex],
        cancelled: false,
      };

      // Draw 4 cards for new turn
      this.drawCards(this.handSize);
    }

    const logMessage = logSegments.join(' ');
    this.state.lastLog = logMessage;

    return {
      contrabandCount: contrabandInHand.length,
      contrabandHeatAdded,
      enemyIntentExecuted: executedIntent,
      enemyDamageDealt,
      damageAbsorbedByEvasion,
      hullDamageTaken,
      enemyShieldGained,
      enemyHeatAdded,
      outcome: this.state.outcome,
      logMessage,
    };
  }
}
