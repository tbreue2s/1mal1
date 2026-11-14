import {
  generateMultFacts,
  generatePlusMinusFacts,
  selectTaskVariant,
} from './generator';
import type { QueuedTaskV3 } from './chapters';
import type {
  FactFamily,
  GameMode,
  UserProfileV3,
  UserStatsV3,
} from './types';

export const V3_PROFILES_STORAGE_KEY = 'v3_profiles';
export const V3_ACTIVE_PROFILE_ID_KEY = 'v3_active_profile_id';
export const V3_THEME_STORAGE_KEY = 'v3_theme_preference';

export const AVAILABLE_AVATARS = [
  '🐧',
  '🦦',
  '🦊',
  '🦁',
  '🐼',
  '🦉',
  '🦄',
  '🚀',
  '🦖',
  '🐯',
  '🐨',
  '⭐',
];

export function getDefaultStatsV3(): UserStatsV3 {
  return {
    stars: 0,
    streakDays: 0,
    lastPracticeDate: null,
    totalSolved: 0,
    fastSolved: 0,
    soundEnabled: true,
    sessionSize: 10,
  };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createNewProfileV3(
  name = 'Spieler 1',
  avatar = '🐧'
): UserProfileV3 {
  const id = `user_v3_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name: name.trim() || 'Spieler 1',
    avatar,
    activeGameMode: 'mult',
    createdAt: Date.now(),
    multStats: getDefaultStatsV3(),
    multFacts: generateMultFacts(),
    plusMinusStats: getDefaultStatsV3(),
    plusMinusFacts: generatePlusMinusFacts(),
  };
}

export function loadV3ProfilesAndActiveId(): {
  profiles: UserProfileV3[];
  activeProfileId: string;
} {
  if (typeof window === 'undefined') {
    const fallback = createNewProfileV3();
    return { profiles: [fallback], activeProfileId: fallback.id };
  }

  try {
    const raw = window.localStorage.getItem(V3_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfileV3[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedActiveId = window.localStorage.getItem(V3_ACTIVE_PROFILE_ID_KEY);
        const exists = parsed.some((p) => p.id === savedActiveId);
        const activeProfileId = exists && savedActiveId ? savedActiveId : parsed[0].id;
        return { profiles: parsed, activeProfileId };
      }
    }
  } catch {}

  const initial = createNewProfileV3();
  saveV3ProfilesAndActiveId([initial], initial.id);
  return { profiles: [initial], activeProfileId: initial.id };
}

export function saveV3ProfilesAndActiveId(
  profiles: UserProfileV3[],
  activeProfileId: string
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(V3_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    window.localStorage.setItem(V3_ACTIVE_PROFILE_ID_KEY, activeProfileId);
  } catch {}
}

export function registerDailyPracticeV3(stats: UserStatsV3): UserStatsV3 {
  const today = getLocalDateString();
  if (stats.lastPracticeDate === today) {
    return stats.streakDays === 0 ? { ...stats, streakDays: 1 } : stats;
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

/**
 * Entzerrt die Session-Queue:
 * - Keine direkte Nachbarschaft derselben Faktenfamilie (Abstand >= 3)
 * - Keine 3 Lückenaufgaben in Folge
 */
export function smartShuffleV3(tasks: QueuedTaskV3[]): QueuedTaskV3[] {
  if (tasks.length <= 1) return [...tasks];

  const pool = [...tasks];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const result: QueuedTaskV3[] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    const recentFamilies = result.slice(-2).map((t) => t.fact.id);
    const lastTwoAreGaps =
      result.length >= 2 &&
      result[result.length - 1].variant.startsWith('gap_') &&
      result[result.length - 2].variant.startsWith('gap_');

    let candidateIdx = remaining.findIndex((t) => {
      if (lastTwoAreGaps && t.variant.startsWith('gap_')) return false;
      if (recentFamilies.includes(t.fact.id)) return false;
      return true;
    });

    if (candidateIdx === -1) {
      candidateIdx = remaining.findIndex((t) => !recentFamilies.includes(t.fact.id));
    }
    if (candidateIdx === -1 && result.length > 0) {
      const lastFam = result[result.length - 1].fact.id;
      candidateIdx = remaining.findIndex((t) => t.fact.id !== lastFam);
    }
    if (candidateIdx === -1) {
      candidateIdx = 0;
    }

    result.push(remaining.splice(candidateIdx, 1)[0]);
  }

  return result;
}

/**
 * Erstellt die Tages-Mission (Daily Session Queue):
 * - Mischt fällige Wiederholungen (max. 60%) mit neuen Fakten (30%) und Festigung (10%).
 * - Weist jedem Faktum über selectTaskVariant() eine kindgerechte Darstellungsform zu.
 */
export function buildDailySessionQueueV3(
  facts: FactFamily[],
  sessionSize = 10,
  now = Date.now()
): QueuedTaskV3[] {
  const due = facts
    .filter((f) => f.totalAttempts > 0 && (f.dueDate <= now || f.repetitions === 0))
    .sort((a, b) => {
      if (a.repetitions === 0 && b.repetitions !== 0) return -1;
      if (b.repetitions === 0 && a.repetitions !== 0) return 1;
      return a.dueDate - b.dueDate;
    });

  const unlearned = facts
    .filter((f) => f.totalAttempts === 0)
    .sort((a, b) => {
      // Zerlegungen und Kernreihen zuerst
      const getPrio = (f: FactFamily) => {
        if (f.mode === 'plusminus') {
          if (f.c <= 6) return 1;
          if (f.c === 10) return 2;
          if (f.c <= 10) return 3;
          if (f.a === f.b) return 4;
          return 5;
        }
        if (f.strategy === 'core_1_10') return 1;
        if (f.strategy === 'core_2_5') return 2;
        if (f.strategy === 'squares') return 3;
        return 4;
      };
      return getPrio(a) - getPrio(b);
    });

  const upcoming = facts
    .filter((f) => f.totalAttempts > 0 && f.dueDate > now && f.repetitions > 0)
    .sort((a, b) => a.dueDate - b.dueDate);

  const selectedFacts: FactFamily[] = [];

  const maxDue = Math.min(due.length, Math.floor(sessionSize * 0.6));
  selectedFacts.push(...due.slice(0, maxDue));

  const neededForNew = sessionSize - selectedFacts.length;
  if (neededForNew > 0 && unlearned.length > 0) {
    selectedFacts.push(...unlearned.slice(0, neededForNew));
  }

  if (selectedFacts.length < sessionSize) {
    const extraDue = due.slice(maxDue, maxDue + (sessionSize - selectedFacts.length));
    selectedFacts.push(...extraDue);
  }
  if (selectedFacts.length < sessionSize) {
    selectedFacts.push(...upcoming.slice(0, sessionSize - selectedFacts.length));
  }

  // Jeder gewählten Faktenfamilie eine dynamische Variante zuweisen
  const tasks: QueuedTaskV3[] = selectedFacts.map((fact) => ({
    fact,
    variant: selectTaskVariant(fact),
  }));

  return smartShuffleV3(tasks);
}

export function countDueFactsV3(facts: FactFamily[], now = Date.now()): number {
  return facts.filter(
    (f) => f.totalAttempts > 0 && (f.dueDate <= now || f.repetitions === 0)
  ).length;
}
