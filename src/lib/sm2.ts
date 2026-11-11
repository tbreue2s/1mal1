import type { MasteryStatus, TaskCard } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.2;

// Entspannte Zeitgrenzen (inkl. Tippzeit auf dem Ziffernblock):
// Bis 4 Sekunden = Blitz-Tempo (q = 4)
// Bis 8 Sekunden = Gutes Tempo (q = 3)
// Über 8 Sekunden = Zögernd / gerechnet (q = 2)
export const FAST_THRESHOLD_MS = 4000;
export const GOOD_THRESHOLD_MS = 8000;

export interface SM2EvaluationResult {
  updatedCard: TaskCard;
  quality: 0 | 2 | 3 | 4;
  starsEarned: number;
  feedbackTitle: string;
  feedbackSubtitle: string;
}

/**
 * Bewertet die Antwortzeit automatisch ohne manuelle Selbstbewertung:
 * - Falsch: q = 0
 * - Richtig <= 4000 ms: q = 4 (automatisiert / Blitz-Tempo)
 * - Richtig 4001..8000 ms: q = 3 (Gutes Tempo)
 * - Richtig > 8000 ms: q = 2 (zögernd / gerechnet)
 */
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
 * Aktualisiert eine Aufgabenkarte nach dem kindgerecht modifizierten SM-2-Algorithmus.
 */
export function applySM2(
  card: TaskCard,
  isCorrect: boolean,
  responseTimeMs: number,
  now: number = Date.now()
): SM2EvaluationResult {
  const quality = evaluateResponseQuality(isCorrect, responseTimeMs);
  const secondsStr = (responseTimeMs / 1000).toFixed(1).replace('.', ',');

  if (quality === 0) {
    // Falsche Antwort: repetitions = 0, sofort wieder fällig
    const newEase = Math.max(
      MIN_EASE_FACTOR,
      Number((card.easeFactor - 0.2).toFixed(2))
    );
    const updatedCard: TaskCard = {
      ...card,
      repetitions: 0,
      interval: 0,
      easeFactor: newEase,
      dueDate: now,
      lastQuality: 0,
      lastResponseMs: Math.round(responseTimeMs),
      totalAttempts: card.totalAttempts + 1,
    };

    return {
      updatedCard,
      quality: 0,
      starsEarned: 0,
      feedbackTitle: 'Fast! Schau dir die Lösung an:',
      feedbackSubtitle: 'Die Aufgabe kommt am Ende der Runde noch einmal dran.',
    };
  }

  const nextRepetitions = card.repetitions + 1;
  let nextEase = card.easeFactor;
  let nextInterval = 1;
  let starsEarned = 1;
  let feedbackTitle = 'Super gelöst!';
  let feedbackSubtitle = `Gelöst in ${secondsStr} Sekunden`;

  if (quality === 4) {
    // Automatisiert (<= 4 s): Intervall wächst maximal
    nextEase = Math.min(
      MAX_EASE_FACTOR,
      Number((card.easeFactor + 0.15).toFixed(2))
    );
    if (nextRepetitions === 1) {
      nextInterval = 2;
    } else if (nextRepetitions === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.min(180, Math.round(card.interval * nextEase * 1.3));
    }
    starsEarned = 2;
    feedbackTitle = 'Blitzschnell! ⚡';
    feedbackSubtitle = `Automatisiert in ${secondsStr} s (+2 ⭐)`;
  } else if (quality === 3) {
    // Gutes Tempo (4 s – 8 s): Standard-Intervallwachstum
    nextEase = Number(card.easeFactor.toFixed(2));
    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 3;
    } else {
      nextInterval = Math.min(180, Math.round(card.interval * nextEase));
    }
    starsEarned = 1;
    feedbackTitle = 'Klasse gemacht! 👍';
    feedbackSubtitle = `Sicher gelöst in ${secondsStr} s (+1 ⭐)`;
  } else {
    // Zögernd / gerechnet (> 8 s, q = 2): Intervall wächst langsamer
    nextEase = Math.max(
      MIN_EASE_FACTOR,
      Number((card.easeFactor - 0.15).toFixed(2))
    );
    if (nextRepetitions === 1) {
      nextInterval = 0.5;
    } else if (nextRepetitions === 2) {
      nextInterval = 1;
    } else {
      nextInterval = Math.min(
        180,
        Math.max(1, Math.round(card.interval * 1.25))
      );
    }
    starsEarned = 1;
    feedbackTitle = 'Richtig gerechnet! 🧠';
    feedbackSubtitle = `Gelöst in ${secondsStr} s (+1 ⭐)`;
  }

  const nextDueDate = Math.round(now + nextInterval * DAY_MS);

  const updatedCard: TaskCard = {
    ...card,
    repetitions: nextRepetitions,
    easeFactor: nextEase,
    interval: nextInterval,
    dueDate: nextDueDate,
    lastQuality: quality,
    lastResponseMs: Math.round(responseTimeMs),
    totalAttempts: card.totalAttempts + 1,
    correctAttempts: card.correctAttempts + 1,
  };

  return {
    updatedCard,
    quality,
    starsEarned,
    feedbackTitle,
    feedbackSubtitle,
  };
}

/**
 * Bestimmt den Lernstatus einer einzelnen Karte:
 * - 'new' (Grau): Noch nie geübt
 * - 'mastered' (Grün): Mindestens 2 erfolgreiche Wiederholungen mit gutem Tempo (q >= 3)
 *   oder blitzschnell automatisiert (q = 4)
 * - 'learning' (Gelb): Geübt, aber noch im Lernprozess
 */
export function getCardMastery(card: TaskCard): MasteryStatus {
  if (card.totalAttempts === 0) {
    return 'new';
  }
  if (
    (card.repetitions >= 2 && (card.lastQuality ?? 0) >= 3) ||
    (card.repetitions >= 1 && card.lastQuality === 4)
  ) {
    return 'mastered';
  }
  return 'learning';
}

/**
 * Bestimmt den Status für ein Feld (a × b) in der 10×10-Matrix anhand aller zugehörigen Karten.
 */
export function getMatrixCellStatus(cardsForFact: TaskCard[]): MasteryStatus {
  const attempted = cardsForFact.filter((c) => c.totalAttempts > 0);
  if (attempted.length === 0) {
    return 'new';
  }

  // Hat eine der versuchten Karten kürzlich einen Fehler (repetitions === 0 oder lastQuality === 0)?
  const anyFailedRecently = attempted.some(
    (c) => c.repetitions === 0 || c.lastQuality === 0
  );
  if (anyFailedRecently) {
    return 'wrong';
  }

  const primaryCard = cardsForFact.find((c) => c.type === 'mult' || c.type === 'add');
  if (primaryCard && getCardMastery(primaryCard) === 'mastered') {
    return 'mastered';
  }

  const masteredCount = attempted.filter((c) => getCardMastery(c) === 'mastered').length;
  if (masteredCount > 0 && attempted.every((c) => c.repetitions > 0)) {
    return 'mastered';
  }

  return 'learning';
}
