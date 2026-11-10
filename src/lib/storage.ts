import { generateAllTaskCards } from './generator';
import type {
  LearningMode,
  LogoVariantId,
  TaskCard,
  TypeFilter,
  UserProfile,
  UserStats,
} from './types';

const LEGACY_CARDS_STORAGE_KEY = '1mal1_cards_v1';
const LEGACY_STATS_STORAGE_KEY = '1mal1_stats_v1';

const PROFILES_STORAGE_KEY = '1mal1_profiles_v2';
const ACTIVE_PROFILE_ID_KEY = '1mal1_active_profile_v2';
const LOGO_VARIANT_KEY = '1mal1_logo_variant_v1';

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

function hydrateCards(savedCards?: Partial<TaskCard>[] | null): TaskCard[] {
  const baseCards = generateAllTaskCards();
  if (!Array.isArray(savedCards) || savedCards.length === 0) {
    return baseCards;
  }

  const storedMap = new Map<string, Partial<TaskCard>>();
  for (const item of savedCards) {
    if (item && typeof item.id === 'string') {
      storedMap.set(item.id, item);
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
}

function hydrateStats(parsed?: Partial<UserStats> | null): UserStats {
  const defaults = getDefaultStats();
  if (!parsed) return defaults;

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
}

export function createNewProfile(name: string, avatar = '🦊'): UserProfile {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name: name.trim() || 'Kind',
    avatar,
    createdAt: Date.now(),
    stats: getDefaultStats(),
    cards: generateAllTaskCards(),
  };
}

/**
 * Lädt alle Benutzerprofile und das aktuell aktive Profil aus dem localStorage.
 * Migriert vorhandene Einzel-Benutzer-Daten (v1) automatisch in das erste Profil.
 */
export function loadProfilesAndActiveId(): {
  profiles: UserProfile[];
  activeProfileId: string;
} {
  if (typeof window === 'undefined') {
    const fallback = createNewProfile('Kind 1', '🦊');
    return { profiles: [fallback], activeProfileId: fallback.id };
  }

  try {
    const rawProfiles = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as Array<Partial<UserProfile>>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const profiles: UserProfile[] = parsed.map((p, idx) => ({
          id: typeof p.id === 'string' && p.id ? p.id : `user_${idx}`,
          name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `Kind ${idx + 1}`,
          avatar:
            typeof p.avatar === 'string' && p.avatar
              ? p.avatar
              : AVAILABLE_AVATARS[idx % AVAILABLE_AVATARS.length],
          logoVariant: p.logoVariant,
          createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
          stats: hydrateStats(p.stats),
          cards: hydrateCards(p.cards),
        }));

        const savedActiveId = window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
        const activeExists = profiles.some((p) => p.id === savedActiveId);
        const activeProfileId = activeExists && savedActiveId ? savedActiveId : profiles[0].id;
        return { profiles, activeProfileId };
      }
    }

    // Prüfe, ob Legacy-Daten (v1) vorhanden sind und migriere sie nahtlos
    const legacyCardsRaw = window.localStorage.getItem(LEGACY_CARDS_STORAGE_KEY);
    const legacyStatsRaw = window.localStorage.getItem(LEGACY_STATS_STORAGE_KEY);

    if (legacyCardsRaw || legacyStatsRaw) {
      const legacyCards = legacyCardsRaw ? JSON.parse(legacyCardsRaw) : null;
      const legacyStats = legacyStatsRaw ? JSON.parse(legacyStatsRaw) : null;
      const migratedProfile: UserProfile = {
        id: 'user_default_1',
        name: 'Spieler 1',
        avatar: '🦊',
        createdAt: Date.now(),
        stats: hydrateStats(legacyStats),
        cards: hydrateCards(legacyCards),
      };
      saveProfilesAndActiveId([migratedProfile], migratedProfile.id);
      return { profiles: [migratedProfile], activeProfileId: migratedProfile.id };
    }
  } catch {
    // Fallback bei korruptem Storage
  }

  const defaultProfile = createNewProfile('Spieler 1', '🦊');
  saveProfilesAndActiveId([defaultProfile], defaultProfile.id);
  return { profiles: [defaultProfile], activeProfileId: defaultProfile.id };
}

export function saveProfilesAndActiveId(
  profiles: UserProfile[],
  activeProfileId: string
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    window.localStorage.setItem(ACTIVE_PROFILE_ID_KEY, activeProfileId);
  } catch {
    // Quota- oder Private-Mode-Fehler ignorieren
  }
}

export function registerDailyPractice(stats: UserStats): UserStats {
  const today = getLocalDateString();
  if (stats.lastPracticeDate === today) {
    // Falls jemand heute schon geübt hat, aber der Streak auf 0 stand, mindestens auf 1 setzen
    return stats.streakDays === 0 ? { ...stats, streakDays: 1 } : stats;
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const nextStreak =
    stats.lastPracticeDate === yesterday ? stats.streakDays + 1 : Math.max(1, stats.streakDays);

  return {
    ...stats,
    streakDays: nextStreak,
    lastPracticeDate: today,
  };
}

/**
 * Erlaubt das manuelle Setzen/Wiederherstellen des Tages-Streaks für den aktuellen Nutzer.
 */
export function setManualStreak(stats: UserStats, newStreakDays: number): UserStats {
  const sanitized = Math.max(0, Math.min(9999, Math.floor(newStreakDays)));
  return {
    ...stats,
    streakDays: sanitized,
    lastPracticeDate: sanitized > 0 ? getLocalDateString() : null,
  };
}

export function resetProfileData(profile: UserProfile): UserProfile {
  return {
    ...profile,
    stats: {
      ...getDefaultStats(),
      soundEnabled: profile.stats.soundEnabled,
    },
    cards: generateAllTaskCards(),
  };
}

export function loadLogoVariant(): LogoVariantId {
  if (typeof window === 'undefined') return 'penguin';
  const saved = window.localStorage.getItem(LOGO_VARIANT_KEY);
  if (
    saved === 'penguin' ||
    saved === 'otter' ||
    saved === 'owl' ||
    saved === 'rocket' ||
    saved === 'fox'
  ) {
    return saved;
  }
  return 'penguin';
}

export function saveLogoVariant(variant: LogoVariantId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOGO_VARIANT_KEY, variant);
  } catch {
    // Ignorieren
  }
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
  const activeRows =
    selectedRows.length > 0 ? selectedRows : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 1. Typ-Filter anwenden
  let candidates = allCards.filter((card) =>
    typeFilter === 'mult_only' ? card.type === 'mult' : true
  );

  // 2. Im Modus 'rows' auf gewählte Reihen beschränken
  if (mode === 'rows') {
    candidates = candidates.filter((card) => activeRows.includes(card.row));
  }

  const dueCards = candidates
    .filter((c) => c.totalAttempts > 0 && (c.dueDate <= now || c.repetitions === 0))
    .sort((a, b) => {
      if (a.repetitions === 0 && b.repetitions !== 0) return -1;
      if (b.repetitions === 0 && a.repetitions !== 0) return 1;
      if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate;
      return a.easeFactor - b.easeFactor;
    });

  const newCards = candidates
    .filter((c) => c.totalAttempts === 0)
    .sort((a, b) => {
      if (mode === 'daily') {
        const prioA = DIDACTIC_ROW_PRIORITY[a.row] ?? 10;
        const prioB = DIDACTIC_ROW_PRIORITY[b.row] ?? 10;
        if (prioA !== prioB) return prioA - prioB;
      }
      if (a.type === 'mult' && b.type !== 'mult') return -1;
      if (b.type === 'mult' && a.type !== 'mult') return 1;
      return Math.random() - 0.5;
    });

  const upcomingCards = candidates
    .filter((c) => c.totalAttempts > 0 && c.dueDate > now && c.repetitions > 0)
    .sort((a, b) => a.dueDate - b.dueDate);

  const selected: TaskCard[] = [];

  if (mode === 'daily') {
    const maxDue = Math.min(dueCards.length, Math.ceil(sessionSize * 0.65));
    selected.push(...dueCards.slice(0, maxDue));

    const remainingForNew = sessionSize - selected.length;
    const newPool = newCards.slice(0, Math.max(remainingForNew * 3, 20));
    const shuffledNew = smartShuffle(newPool);
    selected.push(...shuffledNew.slice(0, remainingForNew));

    if (selected.length < sessionSize) {
      const extraDue = dueCards.slice(maxDue, maxDue + (sessionSize - selected.length));
      selected.push(...extraDue);
    }
    if (selected.length < sessionSize) {
      selected.push(...upcomingCards.slice(0, sessionSize - selected.length));
    }
  } else {
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
