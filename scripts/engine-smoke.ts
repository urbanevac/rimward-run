/**
 * Headless smoke test for CombatEngine with 3-Sector Bejalai Campaign & Black Market (no Phaser).
 * Run: npm run test:engine
 */
import { CombatEngine } from '../src/engine/CombatEngine';
import { Card } from '../src/types/game';

let failures = 0;
function check(label: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

type EngineInternals = { state: { hand: Card[]; drawPile: Card[]; discardPile: Card[] } };

function forceIntoHand(engine: CombatEngine, templateId: Card['templateId']): Card | undefined {
  const s = (engine as unknown as EngineInternals).state;
  const inHand = s.hand.find((c) => c.templateId === templateId);
  if (inHand) return inHand;
  for (const pile of [s.drawPile, s.discardPile]) {
    const idx = pile.findIndex((c) => c.templateId === templateId);
    if (idx >= 0) {
      const [card] = pile.splice(idx, 1);
      s.hand.push(card);
      return card;
    }
  }
  return undefined;
}

// --- Initial Sector 1 State ---
{
  const e = new CombatEngine();
  const s = e.getState();
  check('starts in Sector 1 (Santubong Shallows)', s.sector.number === 1 && s.sector.name === 'Santubong Shallows');
  check('starts with 4 cards in hand', s.hand.length === 4);
  check('total deck = 14 (12 crew + 2 contraband)', s.hand.length + s.drawPile.length === 14);
  check('player stats 30/8/65/25/3', s.player.hull === 30 && s.player.fuel === 8 && s.player.credits === 65 && s.player.heat === 25 && s.player.ap === 3);
  check('Sector 1 enemy is Patrol Skiff (36 Hull / 0 Shield)', s.enemy.hull === 36 && s.enemy.shield === 0 && s.enemy.name === 'Customs Patrol Skiff');
  check('first intent is Cargo Scan', s.enemy.currentIntent.id === 'CARGO_SCAN');
}

// --- Bazaar Haggling cancels intent ---
{
  const e = new CombatEngine();
  const ft = forceIntoHand(e, 'haggling_bazaar')!;
  const r = e.playCard(ft.instanceId);
  const s = e.getState();
  check('Bazaar Haggling plays', r.success && r.cancelledIntent);
  check('Bazaar Haggling costs 15 Cr + 1 AP', s.player.credits === 50 && s.player.ap === 2);
  const heatBefore = s.player.heat;
  (e as unknown as EngineInternals).state.hand = (e as unknown as EngineInternals).state.hand.filter((c) => c.type !== 'Contraband');
  const end = e.endTurn();
  check('jammed Cargo Scan adds no heat', end.enemyHeatAdded === 0 && e.getState().player.heat === heatBefore);
  check('intent advances to Warning Shot', e.getState().enemy.currentIntent.id === 'WARNING_SHOT');
}

// --- Contraband penalty & jettison (Sarikei Black Gold) ---
{
  const e = new CombatEngine();
  const internals = (e as unknown as EngineInternals).state;
  internals.hand = internals.hand.filter((c) => c.type !== 'Contraband');
  const stim = forceIntoHand(e, 'sarikei_black_gold')!;
  check('Sarikei Gold cannot be played', !e.playCard(stim.instanceId).success);
  const end = e.endTurn();
  check('end turn w/ Sarikei Gold: +10 contraband heat', end.contrabandHeatAdded === 10);

  const stim2 = forceIntoHand(e, 'sarikei_black_gold')!;
  const j = e.jettisonCard(stim2.instanceId);
  const s = e.getState();
  check('jettison succeeds & voids contract', j.success && s.contract.voided);
  check('jettisoned card is exhausted & purged from master deck', s.exhaustPile.length === 1 && !s.masterDeck.some((c) => c.instanceId === stim2.instanceId));
}

// --- Black Market Purchases ---
{
  const e = new CombatEngine();
  (e as unknown as { state: { player: { hull: number; heat: number; credits: number; fuel: number } } }).state.player.hull = 15;
  (e as unknown as { state: { player: { hull: number; heat: number; credits: number; fuel: number } } }).state.player.heat = 60;
  (e as unknown as { state: { player: { hull: number; heat: number; credits: number; fuel: number } } }).state.player.credits = 100;

  const buyHull = e.buyBlackMarketItem('repair_10');
  check('buy Belian Hull Patch restores +10 Hull', buyHull.success && e.getState().player.hull === 25 && e.getState().player.credits === 75);

  const buyCool = e.buyBlackMarketItem('cool_25');
  check('buy Bribe Customs cools -25% Heat', buyCool.success && e.getState().player.heat === 35 && e.getState().player.credits === 50);

  const buyFuel = e.buyBlackMarketItem('fuel_2');
  check('buy Refuel Cell adds +2 Fuel', buyFuel.success && e.getState().player.fuel === 10 && e.getState().player.credits === 30);

  const buyEliteFail = e.buyBlackMarketItem('card_terabai');
  check('cannot buy elite card without 40 Cr', !buyEliteFail.success);
}

// --- 3-Sector Progression & Final Boss Victory ---
{
  const e = new CombatEngine();
  
  // Defeat Sector 1 Skiff (36 Hull)
  (e as unknown as { state: { enemy: { hull: number } } }).state.enemy.hull = 6;
  const ps = forceIntoHand(e, 'parang_snap')!;
  const r1 = e.playCard(ps.instanceId);
  check('Sector 1 Skiff defeated -> VICTORY (not campaign complete)', r1.killedEnemy && e.getState().outcome === 'VICTORY' && !e.getState().isCampaignComplete);

  // Jump to Sector 2
  const jump2 = e.advanceToNextSector();
  check('Jump to Sector 2 consumes 1 Fuel', jump2.success && e.getState().sector.number === 2 && e.getState().player.fuel === 7);
  check('Sector 2 enemy is Alliance Rajah Cutter (48 Hull / 0 Shield)', e.getState().enemy.name === 'Alliance Rajah Cutter' && e.getState().enemy.hull === 48);

  // Defeat Sector 2 Cutter (48 Hull)
  (e as unknown as { state: { enemy: { hull: number } } }).state.enemy.hull = 6;
  const ps2 = forceIntoHand(e, 'parang_snap')!;
  e.playCard(ps2.instanceId);
  check('Sector 2 Cutter defeated -> VICTORY', e.getState().outcome === 'VICTORY' && !e.getState().isCampaignComplete);

  // Jump to Sector 3 (Bario Blockade)
  const jump3 = e.advanceToNextSector();
  check('Jump to Sector 3 consumes 1 Fuel', jump3.success && e.getState().sector.number === 3 && e.getState().player.fuel === 6);
  check('Sector 3 enemy is Brooke Dreadnought (65 Hull / 10 Shield)', e.getState().enemy.name === 'Brooke Dreadnought' && e.getState().enemy.hull === 65 && e.getState().enemy.shield === 10);

  // Defeat Sector 3 Boss
  (e as unknown as { state: { enemy: { hull: number; shield: number } } }).state.enemy.shield = 0;
  (e as unknown as { state: { enemy: { hull: number; shield: number } } }).state.enemy.hull = 6;
  const ps3 = forceIntoHand(e, 'parang_snap')!;
  const r3 = e.playCard(ps3.instanceId);
  check('Sector 3 Boss defeated -> CAMPAIGN COMPLETE!', r3.killedEnemy && e.getState().outcome === 'VICTORY' && e.getState().isCampaignComplete);
}

// --- Heat Defeat ---
{
  const e = new CombatEngine();
  (e as unknown as { state: { player: { heat: number } } }).state.player.heat = 90;
  (e as unknown as EngineInternals).state.hand = (e as unknown as EngineInternals).state.hand.filter((c) => c.type !== 'Contraband');
  const end = e.endTurn();
  check('heat reaching 100 -> DEFEAT_HEAT', end.outcome === 'DEFEAT_HEAT' && e.getState().player.heat === 100);
}

console.log(failures === 0 ? '\nAll engine checks passed.' : `\n${failures} check(s) FAILED.`);
if (failures > 0) throw new Error('Engine smoke test failed');
