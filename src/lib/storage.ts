import { generateAllTaskCards } from './generator';
import type { LearningMode, TaskCard, TypeFilter, UserStats } from './types';

const CARDS_STORAGE_KEY = '1mal1_cards_v1';
const STATS_STORAGE_KEY = '1mal1_stats_v1';

// Didaktische Reihenfolge der Reihen beim Neueinstieg (Kernaufgaben zuerst)
const DIDACTIC_ROW_PRIORITY: Record<number, number> = {
  1: 1,
  10: 2,
  2: 3,
  5: 4,
  4: 5,
  3: 6,
  9: 7,
  6: 8,
  8: 9,
  7: 10,
};

export function getDefaultStats(): UserStats {
  return {
    stars: 0,
    streakDays: 0,
    lastPracticeDate: null,
    totalSolved: 0,
    fastSolved: 0,
    soundEnabled: true,
    selectedRows: [2, 5, 10],
    learningMode: 'daily',
    typeFilter: 'mult_only',
    sessionSize: 12,
  };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadCardsFromStorage(): TaskCard[] {
  const baseCards = generateAllTaskCards();
  if (typeof window === 'undefined') return baseCards;

  try {
    const raw = window.localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return baseCards;

    const storedMap = new Map<string, Partial<TaskCard>>();
    const parsed = JSON.parse(raw) as Partial<TaskCard>[];
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item.id === 'string') {
          storedMap.set(item.id, item);
        }
      }
    }

    return baseCards.map((card) => {
      const saved = storedMap.get(card.id);
      if (!saved) return card;
      return {
        ...card,
        repetitions:
          typeof saved.repetitions === 'number' ? saved.repetitions : card.repetitions,
        easeFactor:
          typeof saved.easeFactor === 'number' ? saved.easeFactor : card.easeFactor,
        interval:
          typeof saved.interval === 'number' ? saved.interval : card.interval,
        dueDate:
          typeof saved.dueDate === 'number' ? saved.dueDate : card.dueDate,
        lastQuality: saved.lastQuality,
        lastResponseMs: saved.lastResponseMs,
        totalAttempts:
          typeof saved.totalAttempts === 'number' ? saved.totalAttempts : 0,
        correctAttempts:
          typeof saved.correctAttempts === 'number' ? saved.correctAttempts : 0,
      };
    });
  } catch {
    return baseCards;
  }
}

export function saveCardsToStorage(cards: TaskCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Speichere alle Karten im localStorage
    window.localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Quota oder Private-Mode Fehler ignorieren
  }
}

export function loadStatsFromStorage(): UserStats {
  const defaults = getDefaultStats();
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UserStats>;

    const selectedRows =
      Array.isArray(parsed.selectedRows) && parsed.selectedRows.length > 0
        ? parsed.selectedRows.filter((r) => r >= 1 && r <= 10)
        : defaults.selectedRows;

    const stats: UserStats = {
      stars: typeof parsed.stars === 'number' ? parsed.stars : defaults.stars,
      streakDays:
        typeof parsed.streakDays === 'number' ? parsed.streakDays : defaults.streakDays,
      lastPracticeDate:
        typeof parsed.lastPracticeDate === 'string' ? parsed.lastPracticeDate : null,
      totalSolved:
        typeof parsed.totalSolved === 'number' ? parsed.totalSolved : 0,
      fastSolved:
        typeof parsed.fastSolved === 'number' ? parsed.fastSolved : 0,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      selectedRows: selectedRows.length > 0 ? selectedRows : [2, 5, 10],
      learningMode:
        parsed.learningMode === 'rows' || parsed.learningMode === 'daily'
          ? parsed.learningMode
          : 'daily',
      typeFilter:
        parsed.typeFilter === 'all_types' || parsed.typeFilter === 'mult_only'
          ? parsed.typeFilter
          : 'mult_only',
      sessionSize:
        typeof parsed.sessionSize === 'number' && parsed.sessionSize >= 5
          ? parsed.sessionSize
          : 12,
    };

    // Prüfe, ob der Streak abgelaufen ist (mehr als 1 Tag Pause)
    if (stats.lastPracticeDate) {
      const today = getLocalDateString();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = getLocalDateString(yesterdayDate);

      if (stats.lastPracticeDate !== today && stats.lastPracticeDate !== yesterday) {
        stats.streakDays = 0;
      }
    }

    return stats;
  } catch {
    return defaults;
  }
}

export function saveStatsToStorage(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignorieren
  }
}

export function registerDailyPractice(stats: UserStats): UserStats {
  const today = getLocalDateString();
  if (stats.lastPracticeDate === today) {
    return stats;
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const nextStreak =
    stats.lastPracticeDate === yesterday ? stats.streakDays + 1 : 1;

  return {
    ...stats,
    streakDays: nextStreak,
    lastPracticeDate: today,
  };
}

export function resetAllProgress(): { cards: TaskCard[]; stats: UserStats } {
  const cards = generateAllTaskCards();
  const stats = getDefaultStats();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CARDS_STORAGE_KEY);
    window.localStorage.removeItem(STATS_STORAGE_KEY);
  }
  return { cards, stats };
}

/**
 * Mischt Karten so, dass möglichst nicht zwei Aufgaben derselben Basisfamilie [a, b, c]
 * direkt hintereinander erscheinen.
 */
function smartShuffle(cards: TaskCard[]): TaskCard[] {
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const result: TaskCard[] = [];
  for (const card of pool) {
    if (
      result.length > 0 &&
      result[result.length - 1].fact[0] === card.fact[0] &&
      result[result.length - 1].fact[1] === card.fact[1]
    ) {
      // Suche eine Position weiter vorne zum Tauschen
      const swapIdx = result.findIndex(
        (c, idx) =>
          idx < result.length - 1 &&
          (c.fact[0] !== card.fact[0] || c.fact[1] !== card.fact[1])
      );
      if (swapIdx !== -1) {
        const temp = result[swapIdx];
        result[swapIdx] = card;
        result.push(temp);
        continue;
      }
    }
    result.push(card);
  }

  return result;
}

/**
 * Erstellt eine Trainingsrunde basierend auf Lern-Modus, Reihen-Auswahl und Typ-Filter:
 * 1. 'daily' (Tages-Training / Spaced Repetition): Mischt fällige Wiederholungskarten mit neuen Aufgaben.
 * 2. 'rows' (Fokus-Reihen): Filtert auf ausgewählte Reihen und mischt fällige & neue Aufgaben dieser Reihen.
 */
export function buildSessionQueue(
  allCards: TaskCard[],
  mode: LearningMode,
  selectedRows: number[],
  typeFilter: TypeFilter,
  sessionSize = 12,
  now = Date.now()
): TaskCard[] {
  const activeRows = selectedRows.length > 0 ? selectedRows : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 1. Typ-Filter anwenden
  let candidates = allCards.filter((card) =>
    typeFilter === 'mult_only' ? card.type === 'mult' : true
  );

  // 2. Im Modus 'rows' auf gewählte Reihen beschränken
  if (mode === 'rows') {
    candidates = candidates.filter((card) => activeRows.includes(card.row));
  }

  // Aufteilen in:
  // - Fällige Karten (bereits geübt & dueDate <= now oder zuletzt falsch)
  // - Neue Karten (noch nie geübt)
  // - Zukünftige Wiederholungskarten (falls weniger als sessionSize Karten fällig/neu sind)
  const dueCards = candidates
    .filter((c) => c.totalAttempts > 0 && (c.dueDate <= now || c.repetitions === 0))
    .sort((a, b) => {
      // Fehlerhafte Karten zuerst, danach nach Fälligkeit und niedrigerem EaseFactor
      if (a.repetitions === 0 && b.repetitions !== 0) return -1;
      if (b.repetitions === 0 && a.repetitions !== 0) return 1;
      if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate;
      return a.easeFactor - b.easeFactor;
    });

  const newCards = candidates
    .filter((c) => c.totalAttempts === 0)
    .sort((a, b) => {
      if (mode === 'daily') {
        // Im Tages-Training didaktisch sinnvolle Kernreihen bevorzugen
        const prioA = DIDACTIC_ROW_PRIORITY[a.row] ?? 10;
        const prioB = DIDACTIC_ROW_PRIORITY[b.row] ?? 10;
        if (prioA !== prioB) return prioA - prioB;
      }
      // Standard-Multiplikation vor Lücken/Division bei neuen Fakten
      if (a.type === 'mult' && b.type !== 'mult') return -1;
      if (b.type === 'mult' && a.type !== 'mult') return 1;
      return Math.random() - 0.5;
    });

  const upcomingCards = candidates
    .filter((c) => c.totalAttempts > 0 && c.dueDate > now && c.repetitions > 0)
    .sort((a, b) => a.dueDate - b.dueDate);

  const selected: TaskCard[] = [];

  if (mode === 'daily') {
    // Tages-Training: Bis zu ~65 % fällige Karten + ~35 % neue Karten mischen
    const maxDue = Math.min(dueCards.length, Math.ceil(sessionSize * 0.65));
    selected.push(...dueCards.slice(0, maxDue));

    const remainingForNew = sessionSize - selected.length;
    // Nimm aus den vorderen didaktischen Reihen leicht zufällig gestreut neue Karten
    const newPool = newCards.slice(0, Math.max(remainingForNew * 3, 20));
    const shuffledNew = smartShuffle(newPool);
    selected.push(...shuffledNew.slice(0, remainingForNew));

    // Falls noch Plätze frei sind, mit weiteren fälligen oder kommenden Karten auffüllen
    if (selected.length < sessionSize) {
      const extraDue = dueCards.slice(maxDue, maxDue + (sessionSize - selected.length));
      selected.push(...extraDue);
    }
    if (selected.length < sessionSize) {
      selected.push(...upcomingCards.slice(0, sessionSize - selected.length));
    }
  } else {
    // Fokus-Reihen: Fällige Karten + neue Karten aus den gewählten Reihen
    const maxDue = Math.min(dueCards.length, Math.ceil(sessionSize * 0.6));
    selected.push(...dueCards.slice(0, maxDue));

    const shuffledNew = smartShuffle(newCards);
    selected.push(...shuffledNew.slice(0, sessionSize - selected.length));

    if (selected.length < sessionSize) {
      const extraDue = dueCards.slice(maxDue, maxDue + (sessionSize - selected.length));
      selected.push(...extraDue);
    }
    if (selected.length < sessionSize) {
      const shuffledUpcoming = smartShuffle(upcomingCards);
      selected.push(...shuffledUpcoming.slice(0, sessionSize - selected.length));
    }
  }

  return smartShuffle(selected);
}

/**
 * Zählt aktuell fällige Wiederholungskarten für den gewählten Typ-Filter
 */
export function countDueCards(
  allCards: TaskCard[],
  typeFilter: TypeFilter,
  now = Date.now()
): number {
  return allCards.filter(
    (c) =>
      (typeFilter === 'mult_only' ? c.type === 'mult' : true) &&
      c.totalAttempts > 0 &&
      (c.dueDate <= now || c.repetitions === 0)
  ).length;
}

