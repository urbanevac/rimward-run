import {
  ACTIVE_CONTRACT_SEED,
  INITIAL_PLAYER_STATE,
  SECTORS_DATA,
  createContrabandCards,
  createEliteCard,
  createEnemyForSector,
  createStarterCrewDeck,
  getBlackMarketItemsForSector,
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
  private eliteCardCounter = 1;

  constructor() {
    this.state = this.createInitialCampaignState();
    this.drawCards(this.handSize);
  }

  private createInitialCampaignState(): CombatState {
    const crewDeck = createStarterCrewDeck();
    const contraband = createContrabandCards(ACTIVE_CONTRACT_SEED.contrabandCount);
    const masterDeck = [...crewDeck, ...contraband];
    const initialSector = { ...SECTORS_DATA[0] };
    const enemy = createEnemyForSector(1);

    return {
      turn: 1,
      sector: initialSector,
      isCampaignComplete: false,
      player: { ...INITIAL_PLAYER_STATE },
      enemy,
      contract: { ...ACTIVE_CONTRACT_SEED },
      masterDeck: [...masterDeck],
      drawPile: this.shuffle([...masterDeck]),
      hand: [],
      discardPile: [],
      exhaustPile: [],
      lastLog: `${enemy.name} has locked onto your signature in ${initialSector.name}. Prepare for inspection!`,
      outcome: 'ONGOING',
      creditsEarnedThisRun: 0,
      availableMarketItems: getBlackMarketItemsForSector(1),
    };
  }

  public resetCampaign(): CombatState {
    this.state = this.createInitialCampaignState();
    this.drawCards(this.handSize);
    return this.getState();
  }

  // Alias for backward compatibility
  public resetEncounter(): CombatState {
    return this.resetCampaign();
  }

  public debugTriggerVictory(): void {
    this.state.enemy.hull = 0;
    this.state.outcome = 'VICTORY';
    const isFinalSector = this.state.sector.number >= this.state.sector.maxSectors;
    this.state.isCampaignComplete = isFinalSector;
    if (isFinalSector) {
      if (!this.state.contract.voided) {
        const payout = this.state.contract.payout + 50;
        this.state.creditsEarnedThisRun += payout;
        this.state.player.credits += payout;
      } else {
        this.state.creditsEarnedThisRun += 50;
        this.state.player.credits += 50;
      }
      this.state.lastLog = `CAMPAIGN VICTORY! All 3 Sectors cleared!`;
    } else {
      const sectorSalvage = 35;
      this.state.player.credits += sectorSalvage;
      this.state.creditsEarnedThisRun += sectorSalvage;
      this.state.lastLog = `Sector ${this.state.sector.number} Cleared! Recovered +${sectorSalvage} Cr salvage.`;
    }
  }

  public getState(): CombatState {
    return {
      ...this.state,
      sector: { ...this.state.sector },
      player: { ...this.state.player },
      enemy: {
        ...this.state.enemy,
        intents: this.state.enemy.intents.map((i) => ({ ...i })),
        currentIntent: { ...this.state.enemy.currentIntent },
      },
      contract: { ...this.state.contract },
      masterDeck: [...this.state.masterDeck],
      drawPile: [...this.state.drawPile],
      hand: [...this.state.hand],
      discardPile: [...this.state.discardPile],
      exhaustPile: [...this.state.exhaustPile],
      availableMarketItems: this.state.availableMarketItems.map((item) => ({ ...item })),
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

    // Check enemy defeat
    if (this.state.enemy.hull <= 0) {
      killedEnemy = true;
      if (card.onKillHeatDelta) {
        const prevHeat = this.state.player.heat;
        this.state.player.heat = Math.max(0, Math.min(this.state.player.maxHeat, this.state.player.heat + card.onKillHeatDelta));
        heatDelta = this.state.player.heat - prevHeat;
        logParts.push(`Fatal shot cooled Heat by ${Math.abs(card.onKillHeatDelta)}%`);
      }

      this.state.outcome = 'VICTORY';
      const isFinalSector = this.state.sector.number >= this.state.sector.maxSectors;
      this.state.isCampaignComplete = isFinalSector;

      if (isFinalSector) {
        if (!this.state.contract.voided) {
          this.state.player.credits += this.state.contract.payout + 50;
          this.state.creditsEarnedThisRun += this.state.contract.payout + 50;
          logParts.push(`Dreadnought routed! +${this.state.contract.payout} Cr contract delivered + 50 Cr Boss Bounty!`);
        } else {
          this.state.player.credits += 50;
          this.state.creditsEarnedThisRun += 50;
          logParts.push('Dreadnought routed! +50 Cr Boss Bounty (Contract payout forfeited).');
        }
      } else {
        const sectorBounty = 35;
        this.state.player.credits += sectorBounty;
        this.state.creditsEarnedThisRun += sectorBounty;
        logParts.push(`${this.state.enemy.name} disabled! +${sectorBounty} Cr patrol salvage!`);
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

    // Also remove from master deck so it stays vented across sector jumps
    const masterIdx = this.state.masterDeck.findIndex((c) => c.instanceId === instanceId);
    if (masterIdx !== -1) {
      this.state.masterDeck.splice(masterIdx, 1);
    }

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
      const msg = `${logSegments.join(' ')} Heat hit 100%! Customs clamps locked onto your vessel!`.trim();
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
      logSegments.push(`Cutter's ${executedIntent.name} was jammed by Bazaar Haggling!`);
    } else {
      switch (executedIntent.id) {
        case 'CARGO_SCAN':
        case 'LOCKDOWN_SCAN': {
          enemyHeatAdded = executedIntent.value;
          this.state.player.heat = Math.min(
            this.state.player.maxHeat,
            this.state.player.heat + enemyHeatAdded
          );
          logSegments.push(`${executedIntent.name}: +${enemyHeatAdded}% Heat!`);
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
          logSegments.push(`${this.state.enemy.name} Reinforced Hull (+${enemyShieldGained} Shield).`);
          break;
        }
      }
    }

    // 3. Check Defeat conditions
    if (this.state.player.hull <= 0) {
      this.state.outcome = 'DEFEAT_HULL';
      logSegments.push('Ship Hull breached in deep space!');
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

  // =========================================================================
  // WATERFRONT BLACK MARKET & SECTOR JUMP METHODS
  // =========================================================================

  public buyBlackMarketItem(itemId: string): { success: boolean; reason?: string; message: string } {
    const itemIndex = this.state.availableMarketItems.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) {
      return { success: false, reason: 'Item not available in this market.', message: 'Item not found.' };
    }

    const item = this.state.availableMarketItems[itemIndex];
    if (this.state.player.credits < item.cost) {
      return {
        success: false,
        reason: `Need ${item.cost} Credits (Have ${this.state.player.credits} Cr).`,
        message: 'Insufficient Credits!',
      };
    }

    if (item.type === 'repair' && this.state.player.hull >= this.state.player.maxHull) {
      return {
        success: false,
        reason: `Hull is already at maximum integrity (${this.state.player.maxHull}/${this.state.player.maxHull})!`,
        message: 'Hull already full!',
      };
    }

    if (item.type === 'cool' && this.state.player.heat <= 0) {
      return {
        success: false,
        reason: 'Heat signature is already at 0%!',
        message: 'Heat already 0%!',
      };
    }

    // Deduct cost
    this.state.player.credits -= item.cost;
    let message = '';

    switch (item.type) {
      case 'repair': {
        const prev = this.state.player.hull;
        this.state.player.hull = Math.min(this.state.player.maxHull, this.state.player.hull + 10);
        const gained = this.state.player.hull - prev;
        message = `Repaired +${gained} Hull (-${item.cost} Cr).`;
        break;
      }
      case 'cool': {
        const prev = this.state.player.heat;
        this.state.player.heat = Math.max(0, this.state.player.heat - 25);
        const cooled = prev - this.state.player.heat;
        message = `Cooled Heat by -${cooled}% (-${item.cost} Cr).`;
        break;
      }
      case 'fuel': {
        this.state.player.fuel += 2;
        message = `Added +2 Fuel cells (-${item.cost} Cr).`;
        break;
      }
      case 'card': {
        if (item.cardTemplateId === 'terabai_bastion' || item.cardTemplateId === 'kenyalang_dive') {
          const newCard = createEliteCard(item.cardTemplateId, this.eliteCardCounter++);
          this.state.masterDeck.push(newCard);
          message = `Recruited ${newCard.title} into your deck (-${item.cost} Cr)!`;
        }
        break;
      }
    }

    // Remove purchased item from market
    this.state.availableMarketItems.splice(itemIndex, 1);
    this.state.lastLog = message;

    return { success: true, message };
  }

  public advanceToNextSector(): { success: boolean; reason?: string } {
    if (this.state.sector.number >= this.state.sector.maxSectors) {
      return { success: false, reason: 'Already reached final sector!' };
    }
    if (this.state.player.fuel <= 0) {
      return { success: false, reason: 'Out of Fuel! Cannot spool hyperdrive.' };
    }

    // Consume 1 Fuel for the jump
    this.state.player.fuel -= 1;
    const nextSectorNumber = this.state.sector.number + 1;
    this.state.sector = { ...SECTORS_DATA[nextSectorNumber - 1] };
    this.state.enemy = createEnemyForSector(nextSectorNumber);

    // Refresh deck & piles for fresh sector combat
    this.state.drawPile = this.shuffle([...this.state.masterDeck]);
    this.state.hand = [];
    this.state.discardPile = [];
    this.state.exhaustPile = [];

    // Reset turn stats
    this.state.turn = 1;
    this.state.player.ap = this.state.player.maxAp;
    this.state.player.evasion = 0;
    this.state.outcome = 'ONGOING';

    // Market items for next sector
    this.state.availableMarketItems = getBlackMarketItemsForSector(nextSectorNumber);

    // Draw initial 4 cards
    this.drawCards(this.handSize);

    this.state.lastLog = `Jumped to Sector ${nextSectorNumber}: ${this.state.sector.name}! ${this.state.enemy.name} locked on!`;

    return { success: true };
  }
}
