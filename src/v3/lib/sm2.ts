import type { FactFamily, MasteryStatus, TaskVariant } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.2;

// Kindgerechte Schwellenwerte inklusive Lesezeit und Motorik auf dem Ziffernblock:
// Bis 6,0 Sekunden: Automatisiert / Blitz-Tempo (q = 4)
// Bis 12,0 Sekunden: Sicher gelöst / Gutes Tempo (q = 3)
// Über 12,0 Sekunden: Ausgerechnet / Zögernd (q = 2, OHNE Ease-Abzug!)
export const FAST_THRESHOLD_MS = 6000;
export const GOOD_THRESHOLD_MS = 12000;

export interface SM2FactEvaluationResult {
  updatedFact: FactFamily;
  quality: 0 | 2 | 3 | 4;
  starsEarned: number;
  feedbackTitle: string;
  feedbackSubtitle: string;
}

export function evaluateResponseQuality(
  isCorrect: boolean,
  responseTimeMs: number
): 0 | 2 | 3 | 4 {
  if (!isCorrect) return 0;
  if (responseTimeMs <= FAST_THRESHOLD_MS) return 4;
  if (responseTimeMs <= GOOD_THRESHOLD_MS) return 3;
  return 2;
}

/**
 * Aktualisiert eine Faktenfamilie nach dem kindgerecht modifizierten SM-2-Algorithmus.
 * Wichtigster didaktischer Unterschied zu Standard-SM-2:
 * Richtige Antworten, die länger als 12 Sekunden dauern (q = 2), werden NICHT mit
 * sinkendem Ease-Faktor bestraft. Denn sorgfältiges Rechnen ist in der Grundschule
 * ein Erfolg und kein Versagen.
 */
export function applySM2ToFact(
  fact: FactFamily,
  variant: TaskVariant,
  isCorrect: boolean,
  responseTimeMs: number,
  now: number = Date.now()
): SM2FactEvaluationResult {
  const quality = evaluateResponseQuality(isCorrect, responseTimeMs);
  const secondsStr = (responseTimeMs / 1000).toFixed(1).replace('.', ',');

  if (quality === 0) {
    // Fehler: repetitions wird zurückgesetzt, Fälligkeit sofort
    const newEase = Math.max(
      MIN_EASE_FACTOR,
      Number((fact.easeFactor - 0.2).toFixed(2))
    );
    const updatedFact: FactFamily = {
      ...fact,
      repetitions: 0,
      interval: 0,
      easeFactor: newEase,
      dueDate: now,
      lastQuality: 0,
      lastResponseMs: Math.round(responseTimeMs),
      totalAttempts: fact.totalAttempts + 1,
    };

    return {
      updatedFact,
      quality: 0,
      starsEarned: 0,
      feedbackTitle: 'Schau dir die Lösung an:',
      feedbackSubtitle: 'Die Aufgabe kommt am Ende der Runde noch einmal zur Festigung dran.',
    };
  }

  const nextRepetitions = fact.repetitions + 1;
  let nextEase = fact.easeFactor;
  let nextInterval = 1;
  let starsEarned = 1;
  let feedbackTitle = 'Super gelöst!';
  let feedbackSubtitle = `Gelöst in ${secondsStr} Sekunden (+1 ⭐)`;

  if (quality === 4) {
    // Blitzschnell automatisiert (<= 6 s)
    nextEase = Math.min(
      MAX_EASE_FACTOR,
      Number((fact.easeFactor + 0.15).toFixed(2))
    );
    if (nextRepetitions === 1) {
      nextInterval = 2;
    } else if (nextRepetitions === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.min(180, Math.round(fact.interval * nextEase * 1.3));
    }
    starsEarned = 2;
    feedbackTitle = 'Blitzschnell! ⚡';
    feedbackSubtitle = `Automatisiert in ${secondsStr} s (+2 ⭐)`;
  } else if (quality === 3) {
    // Gutes Tempo (6 s – 12 s)
    nextEase = Number(fact.easeFactor.toFixed(2));
    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 3;
    } else {
      nextInterval = Math.min(180, Math.round(fact.interval * nextEase));
    }
    starsEarned = 1;
    feedbackTitle = 'Klasse gemacht! 👍';
    feedbackSubtitle = `Sicher gelöst in ${secondsStr} s (+1 ⭐)`;
  } else {
    // Gerechnet (> 12 s): Intervall wächst moderat, Ease-Faktor bleibt stabil
    nextEase = Number(fact.easeFactor.toFixed(2));
    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 2;
    } else {
      nextInterval = Math.min(180, Math.max(1, Math.round(fact.interval * 1.2)));
    }
    starsEarned = 1;
    feedbackTitle = 'Richtig ausgerechnet! 🧠';
    feedbackSubtitle = `Erfolgreich gerechnet in ${secondsStr} s (+1 ⭐)`;
  }

  const nextDueDate = Math.round(now + nextInterval * DAY_MS);

  // Transferform als gemeistert markieren, wenn quality >= 3
  const nextMastered = [...fact.masteredVariants];
  if (quality >= 3 && !nextMastered.includes(variant)) {
    nextMastered.push(variant);
  }

  const updatedFact: FactFamily = {
    ...fact,
    repetitions: nextRepetitions,
    easeFactor: nextEase,
    interval: nextInterval,
    dueDate: nextDueDate,
    lastQuality: quality,
    lastResponseMs: Math.round(responseTimeMs),
    totalAttempts: fact.totalAttempts + 1,
    correctAttempts: fact.correctAttempts + 1,
    masteredVariants: nextMastered,
  };

  return {
    updatedFact,
    quality,
    starsEarned,
    feedbackTitle,
    feedbackSubtitle,
  };
}

/**
 * Bestimmt den Status einer Faktenfamilie (für Matrix und Heatmap):
 * - 'new' (Grau): Noch nie geübt
 * - 'wrong' (Rot): Kürzlicher Fehler, muss wiederholt werden
 * - 'mastered' (Grün): Fest im Langzeitgedächtnis (mindestens 2 Bestätigungen mit gutem Tempo oder 1x Blitztempo)
 * - 'learning' (Gelb): Wird aktuell gelernt
 */
export function getFactMastery(fact: FactFamily): MasteryStatus {
  if (fact.totalAttempts === 0) {
    return 'new';
  }
  if (fact.repetitions === 0 || fact.lastQuality === 0) {
    return 'wrong';
  }
  if (
    (fact.repetitions >= 2 && (fact.lastQuality ?? 0) >= 3) ||
    (fact.repetitions >= 1 && fact.lastQuality === 4)
  ) {
    return 'mastered';
  }
  return 'learning';
}
