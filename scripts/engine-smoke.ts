/**
 * Headless smoke test for CombatEngine with Sarawakian deck (no Phaser).
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

/** Move a specific template card into hand (test-only helper). */
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

// --- Initial state ---
{
  const e = new CombatEngine();
  const s = e.getState();
  check('starts with 4 cards in hand', s.hand.length === 4);
  check('total deck = 14 (12 crew + 2 contraband)', s.hand.length + s.drawPile.length === 14);
  check('player stats 30/8/65/25/3', s.player.hull === 30 && s.player.fuel === 8 && s.player.credits === 65 && s.player.heat === 25 && s.player.ap === 3);
  check('enemy 48 hull / 0 shield', s.enemy.hull === 48 && s.enemy.shield === 0);
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
  // Remove contraband from hand so only the intent matters
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
  const end = e.endTurn(); // Cargo Scan +15, Stims +10
  check('end turn w/ Sarikei Gold: +10 contraband heat', end.contrabandHeatAdded === 10);
  check('heat = 25 + 10 + 15 = 50', e.getState().player.heat === 50);

  const stim2 = forceIntoHand(e, 'sarikei_black_gold')!;
  const j = e.jettisonCard(stim2.instanceId);
  const s = e.getState();
  check('jettison succeeds & voids contract', j.success && s.contract.voided);
  check('jettisoned card is exhausted (not in any pile)', s.exhaustPile.length === 1 && ![...s.hand, ...s.drawPile, ...s.discardPile].some((c) => c.instanceId === stim2.instanceId));
  const ps = forceIntoHand(e, 'parang_snap')!;
  check('cannot jettison crew cards', !e.jettisonCard(ps.instanceId).success);
}

// --- Evasion absorbs damage then resets (Rapid Skim) ---
{
  const e = new CombatEngine();
  const st = (e as unknown as EngineInternals).state;
  st.hand = st.hand.filter((c) => c.type !== 'Contraband');
  e.endTurn(); // scan
  st.hand = st.hand.filter((c) => c.type !== 'Contraband');
  const rs = forceIntoHand(e, 'rapid_skim')!;
  e.playCard(rs.instanceId);
  const end = e.endTurn(); // Warning Shot 7
  check('Evasion 6 absorbs 6 of 7 dmg', end.damageAbsorbedByEvasion === 6 && end.hullDamageTaken === 1);
  check('evasion resets to 0 next turn', e.getState().player.evasion === 0);
}

// --- Full victory loop ---
{
  const e = new CombatEngine();
  let guard = 0;
  while (e.getState().outcome === 'ONGOING' && guard++ < 50) {
    const st = (e as unknown as EngineInternals).state;
    // Always jettison contraband; spam damage
    for (const c of [...st.hand]) if (c.type === 'Contraband') e.jettisonCard(c.instanceId);
    for (const c of [...e.getState().hand]) {
      if (e.canPlayCard(c.instanceId).playable && c.damage) e.playCard(c.instanceId);
    }
    if (e.getState().outcome === 'ONGOING') e.endTurn();
  }
  const s = e.getState();
  check(`aggressive run reaches an outcome (${s.outcome}, turn ${s.turn})`, s.outcome !== 'ONGOING');
  if (s.outcome === 'VICTORY') {
    check('voided contract pays 0 Cr', s.creditsEarnedThisRun === 0);
  }
  e.resetEncounter();
  check('reset restores ONGOING + full enemy hull', e.getState().outcome === 'ONGOING' && e.getState().enemy.hull === 48);
}

// --- Victory with payout (Sumpit Dart fatal shot) ---
{
  const e = new CombatEngine();
  const st = (e as unknown as EngineInternals).state as unknown as { enemy: { hull: number }; player: { heat: number } } & EngineInternals['state'];
  st.enemy.hull = 10;
  const sd = forceIntoHand(e, 'sumpit_dart')!;
  const r = e.playCard(sd.instanceId);
  const s = e.getState();
  check("Sumpit Dart kill → VICTORY", r.killedEnemy && s.outcome === 'VICTORY');
  check('kill shot reduces heat by 10', s.player.heat === 15);
  check('intact contract pays 120 Cr', s.creditsEarnedThisRun === 120 && s.player.credits === 185);
}

// --- Heat defeat ---
{
  const e = new CombatEngine();
  const st = (e as unknown as EngineInternals).state as unknown as { player: { heat: number } } & EngineInternals['state'];
  st.player.heat = 90;
  st.hand = st.hand.filter((c) => c.type !== 'Contraband');
  const end = e.endTurn(); // Cargo Scan +15 → 100
  check('heat reaching 100 → DEFEAT_HEAT', end.outcome === 'DEFEAT_HEAT' && e.getState().player.heat === 100);
}

console.log(failures === 0 ? '\nAll engine checks passed.' : `\n${failures} check(s) FAILED.`);
if (failures > 0) throw new Error('Engine smoke test failed');
