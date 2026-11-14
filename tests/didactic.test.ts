import assert from 'node:assert';
import {
  classifyStrategyMult,
  classifyStrategyPM,
  generateMultFacts,
  generatePlusMinusFacts,
  selectTaskVariant,
} from '../src/v3/lib/generator';
import { getWorldChaptersV3 } from '../src/v3/lib/chapters';
import { applySM2ToFact, evaluateResponseQuality } from '../src/v3/lib/sm2';
import type { FactFamily } from '../src/v3/lib/types';

console.log('=== START DIDACTIC TESTS V3 ===');

// --- TEST 1: Fakten-Vollständigkeit & Klassifikation ---
const pmFacts = generatePlusMinusFacts();
assert.strictEqual(pmFacts.length, 100, 'Zahlen-Held muss exakt 100 Fakten haben');

const multFacts = generateMultFacts();
assert.strictEqual(multFacts.length, 100, '1x1 Meister muss exakt 100 Fakten haben');

// Prüfe die 24 vormals fehlenden Fakten
const missingSample = [
  [3, 1, 4], [4, 1, 5], [5, 1, 6], [6, 1, 7], [7, 1, 8], [8, 1, 9],
  [4, 2, 6], [5, 2, 7], [6, 2, 8], [7, 2, 9], [1, 3, 4], [5, 3, 8],
  [6, 3, 9], [1, 4, 5], [2, 4, 6], [1, 5, 6], [2, 5, 7], [3, 5, 8],
  [1, 6, 7], [2, 6, 8], [3, 6, 9], [1, 7, 8], [2, 7, 9], [1, 8, 9]
];

for (const [a, b, c] of missingSample) {
  const fact = pmFacts.find(f => f.a === a && f.b === b);
  assert.ok(fact, `Fakt ${a}+${b}=${c} muss in pmFacts existieren`);
  if (fact) {
    assert.strictEqual(fact.c, c, `Ergebnis von ${a}+${b} muss ${c} sein`);
    assert.strictEqual(fact.strategy, 'up_to_10', `Fakt ${a}+${b}=${c} muss strategy 'up_to_10' sein`);
  }
}
console.log('✓ Test 1 bestanden: 100 Fakten pro Modus & alle 24 ehemals fehlenden Aufgaben vorhanden.');

// --- TEST 2: Lückenlose Zuordnung zu den 3 Welten ---
const pmChapters = getWorldChaptersV3(pmFacts, 'plusminus');
assert.strictEqual(pmChapters.length, 3, 'Es müssen genau 3 Welten sein');

const ch1Facts = pmChapters[0].facts;
const ch2Facts = pmChapters[1].facts;
const ch3Facts = pmChapters[2].facts;

// Welt 1: Alle mit Summe <= 10 (müssen exakt 45 Fakten sein: 9+8+7+6+5+4+3+2+1)
assert.strictEqual(ch1Facts.length, 45, 'Welt 1 (Summe <= 10) muss exakt 45 Fakten enthalten');
for (const [a, b, c] of missingSample) {
  assert.ok(ch1Facts.some(f => f.a === a && f.b === b), `Fakt ${a}+${b}=${c} muss in Welt 1 enthalten sein`);
}

// Welt 2: Summe > 10 und (a === b oder |a - b| === 1)
// Verdopplungen > 10: 6+6, 7+7, 8+8, 9+9, 10+10 (5 Fakten)
// Nachbarn > 10: 5+6, 6+5, 6+7, 7+6, 7+8, 8+7, 8+9, 9+8, 9+10, 10+9 (10 Fakten)
// In Summe 15 Fakten
assert.strictEqual(ch2Facts.length, 15, 'Welt 2 muss exakt 15 Fakten enthalten');

// Welt 3: Summe > 10 und echte Übergänge (40 Fakten)
assert.strictEqual(ch3Facts.length, 40, 'Welt 3 muss exakt 40 Fakten enthalten');

// Gesamt-Check: 45 + 15 + 40 = 100!
assert.strictEqual(ch1Facts.length + ch2Facts.length + ch3Facts.length, 100, 'Alle 100 Fakten müssen abgedeckt sein');
console.log('✓ Test 2 bestanden: Alle 100 Fakten lückenlos in den 3 Rechenwelten.');

// --- TEST 3: Varianten-Auswahl & Didaktische Stufen ---
const newFact: FactFamily = { ...pmFacts[0], repetitions: 0 };
for (let i = 0; i < 500; i++) {
  const v = selectTaskVariant(newFact);
  assert.strictEqual(v, 'add', 'Bei repetitions === 0 muss immer die Grundaufgabe add kommen');
}

const learnedFact: FactFamily = { ...pmFacts[0], repetitions: 1 };
let sawAdd = false;
let sawSub = false;
for (let i = 0; i < 500; i++) {
  const v = selectTaskVariant(learnedFact);
  if (v === 'add') sawAdd = true;
  if (v === 'sub') sawSub = true;
}
assert.ok(sawAdd && sawSub, 'Bei repetitions === 1 müssen Grund- und Umkehraufgaben vorkommen');

const masteredFact: FactFamily = { ...pmFacts[0], repetitions: 3, masteredVariants: [] };
let sawGap = false;
for (let i = 0; i < 500; i++) {
  const v = selectTaskVariant(masteredFact);
  if (v.startsWith('gap_')) sawGap = true;
}
assert.ok(sawGap, 'Bei repetitions >= 2 müssen auch Lückenaufgaben vorkommen');
console.log('✓ Test 3 bestanden: Varianten-Auswahl schützt vor Überforderung und steigert sich stufenweise.');

// --- TEST 4: SM-2 Engine & Kindgerechte Zeitfenster ---
assert.strictEqual(evaluateResponseQuality(true, 4000), 4, '4s ist q=4 (Blitzschnell)');
assert.strictEqual(evaluateResponseQuality(true, 5999), 4, '< 6s ist q=4 (Blitzschnell)');
assert.strictEqual(evaluateResponseQuality(true, 6001), 3, '6.001s ist q=3 (Sicher gelöst)');
assert.strictEqual(evaluateResponseQuality(true, 11999), 3, '< 12s ist q=3 (Sicher gelöst)');
assert.strictEqual(evaluateResponseQuality(true, 13500), 2, '> 12s ist q=2 (Ausgerechnet)');
assert.strictEqual(evaluateResponseQuality(false, 3000), 0, 'Falsch ist immer q=0');

// Prüfe: Keine Ease-Bestrafung bei q = 2
const slowResult = applySM2ToFact(pmFacts[0], 'add', true, 14000);
assert.strictEqual(slowResult.quality, 2);
assert.strictEqual(slowResult.updatedFact.easeFactor, pmFacts[0].easeFactor, 'Ease Factor darf bei q=2 NICHT sinken!');
assert.strictEqual(slowResult.starsEarned, 1, 'Langsame richtige Antwort gibt trotzdem 1 Stern');

// Prüfe: Fehler verringert Ease und setzt repetitions zurück
const failResult = applySM2ToFact(pmFacts[0], 'add', false, 3000);
assert.strictEqual(failResult.quality, 0);
assert.strictEqual(failResult.updatedFact.repetitions, 0);
assert.strictEqual(failResult.updatedFact.interval, 0);
assert.ok(failResult.updatedFact.easeFactor < pmFacts[0].easeFactor, 'Ease Factor muss bei Fehler sinken');

console.log('✓ Test 4 bestanden: SM-2 Engine bewertet fair, bestraft keine langsame Rechenzeit und vergibt Sterne.');

console.log('=== ALLE DIDAKTISCHEN TESTS ERFOLGREICH BESTANDEN! ===');
