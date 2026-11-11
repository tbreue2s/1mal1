import { generateAllTaskCards, generatePlusMinusCards } from './generator';
import type {
  GameMode,
  LearningMode,
  LogoVariantId,
  PlusMinusFocus,
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

// Didaktische Reihenfolge der Reihen beim 1×1-Neueinstieg (Kernaufgaben zuerst)
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

export function getDefaultStats(mode: GameMode = 'mult'): UserStats {
  return {
    stars: 0,
    streakDays: 0,
    lastPracticeDate: null,
    totalSolved: 0,
    fastSolved: 0,
    soundEnabled: true,
    selectedRows: mode === 'mult' ? [2, 5, 10] : [1, 2, 5, 10],
    learningMode: 'daily',
    typeFilter: 'mult_only',
    plusMinusFocus: 'up_to_10',
    sessionSize: 12,
  };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hydrateCards(
  savedCards: Partial<TaskCard>[] | null | undefined,
  mode: GameMode
): TaskCard[] {
  const baseCards =
    mode === 'plusminus' ? generatePlusMinusCards() : generateAllTaskCards();
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

function hydrateStats(
  parsed: Partial<UserStats> | null | undefined,
  mode: GameMode = 'mult'
): UserStats {
  const defaults = getDefaultStats(mode);
  if (!parsed) return defaults;

  const selectedRows =
    Array.isArray(parsed.selectedRows) && parsed.selectedRows.length > 0
      ? parsed.selectedRows.filter((r) => r >= 1 && r <= 10)
      : defaults.selectedRows;

  const validFocus =
    parsed.plusMinusFocus === 'number_bonds_10' ||
    parsed.plusMinusFocus === 'up_to_10' ||
    parsed.plusMinusFocus === 'over_10' ||
    parsed.plusMinusFocus === 'doubles' ||
    parsed.plusMinusFocus === 'rows'
      ? parsed.plusMinusFocus
      : defaults.plusMinusFocus;

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
    selectedRows: selectedRows.length > 0 ? selectedRows : defaults.selectedRows,
    learningMode:
      parsed.learningMode === 'rows' || parsed.learningMode === 'daily'
        ? parsed.learningMode
        : 'daily',
    typeFilter:
      parsed.typeFilter === 'all_types' || parsed.typeFilter === 'mult_only'
        ? parsed.typeFilter
        : 'mult_only',
    plusMinusFocus: validFocus,
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

export function createNewProfile(name: string, avatar = '🐧'): UserProfile {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name: name.trim() || 'Kind',
    avatar,
    activeGameMode: 'mult',
    createdAt: Date.now(),
    stats: getDefaultStats('mult'),
    cards: generateAllTaskCards(),
    plusMinusStats: getDefaultStats('plusminus'),
    plusMinusCards: generatePlusMinusCards(),
  };
}

/**
 * Lädt alle Benutzerprofile und das aktuell aktive Profil aus dem localStorage.
 * Bestehende 1×1-Fortschritte bleiben zu 100 % erhalten; fehlende "Zahlenheld"-Felder
 * werden verlustfrei ergänzt.
 */
export function loadProfilesAndActiveId(): {
  profiles: UserProfile[];
  activeProfileId: string;
} {
  if (typeof window === 'undefined') {
    const fallback = createNewProfile('Kind 1', '🐧');
    return { profiles: [fallback], activeProfileId: fallback.id };
  }

  try {
    const rawProfiles = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as Array<Partial<UserProfile>>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const profiles: UserProfile[] = parsed.map((p, idx) => {
          const userId =
            typeof p.id === 'string' && p.id ? p.id : `user_${idx}`;

          // Prüfe zusätzlich auf dedizierte Modus-Schlüssel user_${id}_progress_mult / plusminus
          let multSavedCards = p.cards;
          let multSavedStats = p.stats;
          let pmSavedCards = p.plusMinusCards;
          let pmSavedStats = p.plusMinusStats;

          try {
            const rawMult = window.localStorage.getItem(
              `user_${userId}_progress_mult`
            );
            if (rawMult && (!multSavedCards || multSavedCards.length === 0)) {
              const parsedMult = JSON.parse(rawMult);
              multSavedCards = parsedMult.cards ?? multSavedCards;
              multSavedStats = parsedMult.stats ?? multSavedStats;
            }
            const rawPm = window.localStorage.getItem(
              `user_${userId}_progress_plusminus`
            );
            if (rawPm && (!pmSavedCards || pmSavedCards.length === 0)) {
              const parsedPm = JSON.parse(rawPm);
              pmSavedCards = parsedPm.cards ?? pmSavedCards;
              pmSavedStats = parsedPm.stats ?? pmSavedStats;
            }
          } catch {
            // Ignorieren
          }

          return {
            id: userId,
            name:
              typeof p.name === 'string' && p.name.trim()
                ? p.name.trim()
                : `Kind ${idx + 1}`,
            avatar:
              typeof p.avatar === 'string' && p.avatar
                ? p.avatar
                : AVAILABLE_AVATARS[idx % AVAILABLE_AVATARS.length],
            logoVariant: p.logoVariant,
            activeGameMode:
              p.activeGameMode === 'plusminus' ? 'plusminus' : 'mult',
            createdAt:
              typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
            stats: hydrateStats(multSavedStats, 'mult'),
            cards: hydrateCards(multSavedCards, 'mult'),
            plusMinusStats: hydrateStats(pmSavedStats, 'plusminus'),
            plusMinusCards: hydrateCards(pmSavedCards, 'plusminus'),
          };
        });

        const savedActiveId = window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
        const activeExists = profiles.some((p) => p.id === savedActiveId);
        const activeProfileId =
          activeExists && savedActiveId ? savedActiveId : profiles[0].id;
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
        avatar: '🐧',
        activeGameMode: 'mult',
        createdAt: Date.now(),
        stats: hydrateStats(legacyStats, 'mult'),
        cards: hydrateCards(legacyCards, 'mult'),
        plusMinusStats: getDefaultStats('plusminus'),
        plusMinusCards: generatePlusMinusCards(),
      };
      saveProfilesAndActiveId([migratedProfile], migratedProfile.id);
      return { profiles: [migratedProfile], activeProfileId: migratedProfile.id };
    }
  } catch {
    // Fallback bei korruptem Storage
  }

  const defaultProfile = createNewProfile('Spieler 1', '🐧');
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

    // Speichere zusätzlich isolierte Schlüssel je Nutzer und Modus
    for (const p of profiles) {
      window.localStorage.setItem(
        `user_${p.id}_progress_mult`,
        JSON.stringify({ stats: p.stats, cards: p.cards })
      );
      window.localStorage.setItem(
        `user_${p.id}_progress_plusminus`,
        JSON.stringify({ stats: p.plusMinusStats, cards: p.plusMinusCards })
      );
    }
  } catch {
    // Quota- oder Private-Mode-Fehler ignorieren
  }
}

export function removeProfileStorageKeys(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`user_${userId}_progress_mult`);
    window.localStorage.removeItem(`user_${userId}_progress_plusminus`);
  } catch {
    // Ignorieren
  }
}

export function registerDailyPractice(stats: UserStats): UserStats {
  const today = getLocalDateString();
  if (stats.lastPracticeDate === today) {
    return stats.streakDays === 0 ? { ...stats, streakDays: 1 } : stats;
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const nextStreak =
    stats.lastPracticeDate === yesterday
      ? stats.streakDays + 1
      : Math.max(1, stats.streakDays);

  return {
    ...stats,
    streakDays: nextStreak,
    lastPracticeDate: today,
  };
}

/**
 * Erlaubt das manuelle Setzen/Wiederherstellen des Tages-Streaks für den aktuellen Nutzer & Modus.
 */
export function setManualStreak(stats: UserStats, newStreakDays: number): UserStats {
  const sanitized = Math.max(0, Math.min(9999, Math.floor(newStreakDays)));
  return {
    ...stats,
    streakDays: sanitized,
    lastPracticeDate: sanitized > 0 ? getLocalDateString() : null,
  };
}

/**
 * Setzt entweder nur einen bestimmten Modus ('mult' oder 'plusminus') oder beide Modi
 * eines Benutzerprofils zurück, ohne den anderen Modus zu überschreiben.
 */
export function resetProfileData(
  profile: UserProfile,
  targetMode?: GameMode | 'both'
): UserProfile {
  const modeToReset = targetMode ?? profile.activeGameMode ?? 'mult';
  const soundEnabled = profile.stats.soundEnabled;

  if (modeToReset === 'mult') {
    return {
      ...profile,
      stats: { ...getDefaultStats('mult'), soundEnabled },
      cards: generateAllTaskCards(),
    };
  }
  if (modeToReset === 'plusminus') {
    return {
      ...profile,
      plusMinusStats: { ...getDefaultStats('plusminus'), soundEnabled },
      plusMinusCards: generatePlusMinusCards(),
    };
  }
  return {
    ...profile,
    stats: { ...getDefaultStats('mult'), soundEnabled },
    cards: generateAllTaskCards(),
    plusMinusStats: { ...getDefaultStats('plusminus'), soundEnabled },
    plusMinusCards: generatePlusMinusCards(),
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
 * Gibt den eindeutigen Fakt-Familien-Schlüssel zurück.
 * Aufgaben wie 3×7, 7×3, 21:7, 21:3 (bzw. 3+7, 7+3, 10-3, 10-7)
 * teilen sich denselben kanonischen Schlüssel ("3_7").
 */
export function getFactFamilyKey(card: TaskCard): string {
  const [a, b] = card.fact;
  return `${Math.min(a, b)}_${Math.max(a, b)}`;
}

/**
 * Intelligentes Mischen für Trainingsrunden:
 * 1. Kurzzeitgedächtnis-Entzerrung: Verhindert, dass Tauschaufgaben (b×a) oder Umkehraufgaben
 *    (c:b) derselben Fakten-Familie innerhalb von 3 Positionen aufeinanderfolgen (Abstand >= 3).
 * 2. Cognitive-Load-Bremse: Verhindert mehr als 2 Lückenaufgaben in direkter Folge.
 */
export function smartShuffle(cards: TaskCard[]): TaskCard[] {
  if (cards.length <= 1) return [...cards];

  // Zufällige Basis-Mischung (Fisher-Yates)
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const result: TaskCard[] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    // Letzte 2 platzierte Karten: deren Familien-Schlüssel erfassen
    const recentFamilies = result.slice(-2).map(getFactFamilyKey);

    // Letzte 2 platzierte Karten: sind beide Lückenaufgaben?
    const lastTwoAreGaps =
      result.length >= 2 &&
      result[result.length - 1].type.startsWith('gap_') &&
      result[result.length - 2].type.startsWith('gap_');

    // 1. Suche Kandidaten, der BEIDE Bedingungen erfüllt:
    //    - Keine Familienkollision mit den letzten 2 Karten (Abstand >= 3)
    //    - Keine 3. Lückenaufgabe in Folge
    let candidateIdx = remaining.findIndex((c) => {
      if (lastTwoAreGaps && c.type.startsWith('gap_')) return false;
      if (recentFamilies.includes(getFactFamilyKey(c))) return false;
      return true;
    });

    // 2. Falls nicht möglich, weiche zuerst die Lücken-Bedingung auf, behalte aber Familienabstand
    if (candidateIdx === -1) {
      candidateIdx = remaining.findIndex((c) => !recentFamilies.includes(getFactFamilyKey(c)));
    }

    // 3. Falls noch immer nicht möglich (z. B. Mini-Pool mit nur 1-2 Familien),
    //    vermeide zumindest direkte Nachbarschaft (Abstand >= 2)
    if (candidateIdx === -1 && result.length > 0) {
      const lastFamily = getFactFamilyKey(result[result.length - 1]);
      candidateIdx = remaining.findIndex((c) => getFactFamilyKey(c) !== lastFamily);
    }

    // 4. Fallback: Ersten verfügbaren nehmen
    if (candidateIdx === -1) {
      candidateIdx = 0;
    }

    result.push(remaining.splice(candidateIdx, 1)[0]);
  }

  return result;
}

/**
 * Didaktische Priorität für neue Karten im Modus "Zahlenheld" (Plus/Minus bis 20):
 * 1. Zahlenraum bis 10 (Zerlegungen <= 10) & Verdopplungsaufgaben
 * 2. Verliebte Zahlen (Summe = 10)
 * 3. Zehnerübergang (Summe > 10)
 */
function getPlusMinusPriority(card: TaskCard): number {
  const [a, b, c] = card.fact;
  if (c <= 6) return 1;
  if (c === 10) return 2; // Verliebte Zahlen
  if (c <= 10) return 3;  // Zerlegungen bis 10
  if (a === b) return 4;  // Verdoppeln (6+6, 7+7, ...)
  if (a === 10 || b === 10) return 5; // 10 + x
  return 6; // Zehnerübergang (z.B. 7 + 5, 8 + 6)
}

/**
 * Erstellt eine Trainingsrunde basierend auf Spielmodus ('mult' vs. 'plusminus'),
 * Lern-Modus ('daily' vs. 'rows'), Reihen-/Fokus-Auswahl und Typ-Filter.
 */
export function buildSessionQueue(
  allCards: TaskCard[],
  mode: LearningMode,
  selectedRows: number[],
  typeFilter: TypeFilter,
  sessionSize = 12,
  gameMode: GameMode = 'mult',
  plusMinusFocus: PlusMinusFocus = 'up_to_10',
  now = Date.now()
): TaskCard[] {
  const activeRows =
    selectedRows.length > 0 ? selectedRows : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 1. Typ-Filter anwenden (Nur Malnehmen bzw. Nur Plusrechnen vs. Alle Typen inkl. Umkehr & Lücken)
  let candidates = allCards.filter((card) => {
    if (gameMode === 'plusminus' && plusMinusFocus === 'number_bonds_10') {
      // Bei Verliebten Zahlen zur 10: Reine Addition "3+7=?" ist didaktisch witzlos (immer 10).
      // Stufe 1 (mult_only): Ergänzen zur 10 ("3+?=10" und "?+7=10")
      if (typeFilter === 'mult_only') {
        return card.type === 'gap_add_a' || card.type === 'gap_add_b';
      }
      // Stufe 2/3 (all_types): Ergänzen + Subtraktion ("10-3=?") + Minus-Lücke ("10-?=3")
      return card.type !== 'add';
    }

    if (typeFilter === 'mult_only') {
      return gameMode === 'plusminus' ? card.type === 'add' : card.type === 'mult';
    }
    return true;
  });

  // 2. Im Fokus-Modus ('rows') auf gewählte Reihen bzw. Zahlenheld-Kategorie filtern
  if (mode === 'rows') {
    if (gameMode === 'mult') {
      candidates = candidates.filter((card) => activeRows.includes(card.row));
    } else {
      if (plusMinusFocus === 'number_bonds_10') {
        candidates = candidates.filter((card) => card.fact[2] === 10);
      } else if (plusMinusFocus === 'up_to_10') {
        candidates = candidates.filter((card) => card.fact[2] <= 10);
      } else if (plusMinusFocus === 'over_10') {
        candidates = candidates.filter((card) => card.fact[2] > 10);
      } else if (plusMinusFocus === 'doubles') {
        candidates = candidates.filter(
          (card) =>
            card.fact[0] === card.fact[1] ||
            Math.abs(card.fact[0] - card.fact[1]) === 1
        );
      } else {
        candidates = candidates.filter((card) => activeRows.includes(card.row));
      }
    }
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
        if (gameMode === 'plusminus') {
          const prioA = getPlusMinusPriority(a);
          const prioB = getPlusMinusPriority(b);
          if (prioA !== prioB) return prioA - prioB;
        } else {
          const prioA = DIDACTIC_ROW_PRIORITY[a.row] ?? 10;
          const prioB = DIDACTIC_ROW_PRIORITY[b.row] ?? 10;
          if (prioA !== prioB) return prioA - prioB;
        }
      }
      const isPrimaryA = a.type === 'mult' || a.type === 'add';
      const isPrimaryB = b.type === 'mult' || b.type === 'add';
      if (isPrimaryA && !isPrimaryB) return -1;
      if (isPrimaryB && !isPrimaryA) return 1;
      return Math.random() - 0.5;
    });

  const upcomingCards = candidates
    .filter((c) => c.totalAttempts > 0 && c.dueDate > now && c.repetitions > 0)
    .sort((a, b) => a.dueDate - b.dueDate);

  const selected: TaskCard[] = [];

  if (mode === 'daily') {
    // Überfälligkeits-Bremse („Rückstands-Puffer“):
    // Wenn 12 oder mehr Karten überfällig sind, besteht die Session zu 100% aus
    // fälligen Karten ("Auffrisch-Modus"), damit sich kein unüberwindbarer Berg anstaut.
    const isHeavyBacklog = dueCards.length >= sessionSize;
    const maxDue = isHeavyBacklog
      ? Math.min(dueCards.length, sessionSize)
      : Math.min(dueCards.length, Math.ceil(sessionSize * 0.65));

    selected.push(...dueCards.slice(0, maxDue));

    const remainingForNew = sessionSize - selected.length;
    if (remainingForNew > 0) {
      const newPool = newCards.slice(0, Math.max(remainingForNew * 3, 20));
      const shuffledNew = smartShuffle(newPool);
      selected.push(...shuffledNew.slice(0, remainingForNew));
    }

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
 * Zählt aktuell fällige Wiederholungskarten für den gewählten Typ-Filter & Spielmodus
 */
export function countDueCards(
  allCards: TaskCard[],
  typeFilter: TypeFilter,
  gameMode: GameMode = 'mult',
  now = Date.now()
): number {
  return allCards.filter((c) => {
    const matchesType =
      typeFilter === 'mult_only'
        ? gameMode === 'plusminus'
          ? c.type === 'add'
          : c.type === 'mult'
        : true;
    return (
      matchesType &&
      c.totalAttempts > 0 &&
      (c.dueDate <= now || c.repetitions === 0)
    );
  }).length;
}
