import { generateMultFacts, generatePlusMinusFacts } from './generator';
import type {
  FactFamily,
  ImportPromptStatus,
  TaskVariant,
  UserProfileV3,
  UserStatsV3,
} from './types';

export const V3_PROFILES_KEY = 'v3_profiles';
export const V3_ACTIVE_PROFILE_KEY = 'v3_active_profile_id';
export const V3_IMPORT_STATUS_KEY = 'v3_import_status';
export const V2_PROFILES_KEY = '1mal1_profiles_v2';

export function getImportPromptStatus(): ImportPromptStatus {
  if (typeof window === 'undefined') return 'never';
  const val = window.localStorage.getItem(V3_IMPORT_STATUS_KEY);
  if (val === 'done' || val === 'never') return val;
  return 'pending';
}

export function setImportPromptStatus(status: ImportPromptStatus): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(V3_IMPORT_STATUS_KEY, status);
  } catch {}
}

export function checkHasV2Data(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(V2_PROFILES_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/**
 * Konvertiert die alten v2-Karten eines Zahlenpaars (a, b) verlustfrei in eine neue Faktenfamilie.
 */
function convertV2CardsToFact(
  baseFact: FactFamily,
  v2Cards: any[]
): FactFamily {
  const matching = v2Cards.filter(
    (c) => c && c.fact && c.fact[0] === baseFact.a && c.fact[1] === baseFact.b
  );
  if (matching.length === 0) return baseFact;

  const primary = matching.find(
    (c) => c.type === 'mult' || c.type === 'add'
  ) || matching[0];

  const totalAttempts = matching.reduce(
    (sum, c) => sum + (typeof c.totalAttempts === 'number' ? c.totalAttempts : 0),
    0
  );
  const correctAttempts = matching.reduce(
    (sum, c) => sum + (typeof c.correctAttempts === 'number' ? c.correctAttempts : 0),
    0
  );

  const dueDates = matching
    .map((c) => (typeof c.dueDate === 'number' && c.dueDate > 0 ? c.dueDate : 0))
    .filter((d) => d > 0);
  const dueDate = dueDates.length > 0 ? Math.min(...dueDates) : 0;

  const masteredVariants: TaskVariant[] = [];
  for (const c of matching) {
    if (c.repetitions >= 1 && (c.lastQuality ?? 0) >= 2) {
      if (!masteredVariants.includes(c.type)) {
        masteredVariants.push(c.type);
      }
    }
  }

  return {
    ...baseFact,
    repetitions: typeof primary.repetitions === 'number' ? primary.repetitions : 0,
    easeFactor:
      typeof primary.easeFactor === 'number' && primary.easeFactor >= 1.3
        ? primary.easeFactor
        : baseFact.easeFactor,
    interval: typeof primary.interval === 'number' ? primary.interval : 0,
    dueDate,
    lastQuality: primary.lastQuality,
    lastResponseMs: primary.lastResponseMs,
    totalAttempts,
    correctAttempts,
    masteredVariants,
  };
}

/**
 * Konvertiert ein beliebiges v2-Profil in ein v3-Profil.
 */
export function convertV2ProfileToV3(p: any, idx = 0): UserProfileV3 {
  const id = typeof p.id === 'string' && p.id ? p.id : `user_v3_${idx}_${Date.now()}`;
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `Spieler ${idx + 1}`;
  const avatar = typeof p.avatar === 'string' && p.avatar ? p.avatar : '🐧';
  const activeGameMode = p.activeGameMode === 'plusminus' ? 'plusminus' : 'mult';

  // Mult Stats & Fakten
  const v2MultStats = p.stats || {};
  const multStats: UserStatsV3 = {
    stars: typeof v2MultStats.stars === 'number' ? v2MultStats.stars : 0,
    streakDays: typeof v2MultStats.streakDays === 'number' ? v2MultStats.streakDays : 0,
    lastPracticeDate: v2MultStats.lastPracticeDate || null,
    totalSolved: typeof v2MultStats.totalSolved === 'number' ? v2MultStats.totalSolved : 0,
    fastSolved: typeof v2MultStats.fastSolved === 'number' ? v2MultStats.fastSolved : 0,
    soundEnabled: typeof v2MultStats.soundEnabled === 'boolean' ? v2MultStats.soundEnabled : true,
    sessionSize: 10,
  };

  const baseMultFacts = generateMultFacts();
  const v2MultCards = Array.isArray(p.cards) ? p.cards : [];
  const multFacts = baseMultFacts.map((fact) =>
    convertV2CardsToFact(fact, v2MultCards)
  );

  // PlusMinus Stats & Fakten
  const v2PmStats = p.plusMinusStats || {};
  const plusMinusStats: UserStatsV3 = {
    stars: typeof v2PmStats.stars === 'number' ? v2PmStats.stars : 0,
    streakDays: typeof v2PmStats.streakDays === 'number' ? v2PmStats.streakDays : 0,
    lastPracticeDate: v2PmStats.lastPracticeDate || null,
    totalSolved: typeof v2PmStats.totalSolved === 'number' ? v2PmStats.totalSolved : 0,
    fastSolved: typeof v2PmStats.fastSolved === 'number' ? v2PmStats.fastSolved : 0,
    soundEnabled: typeof v2PmStats.soundEnabled === 'boolean' ? v2PmStats.soundEnabled : true,
    sessionSize: 10,
  };

  const basePmFacts = generatePlusMinusFacts();
  const v2PmCards = Array.isArray(p.plusMinusCards) ? p.plusMinusCards : [];
  const plusMinusFacts = basePmFacts.map((fact) =>
    convertV2CardsToFact(fact, v2PmCards)
  );

  return {
    id,
    name,
    avatar,
    activeGameMode,
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    multStats,
    multFacts,
    plusMinusStats,
    plusMinusFacts,
  };
}

/**
 * Validiert und importiert Profile aus einem JSON-String (z.B. Backup-Datei).
 * Unterstützt:
 * - v3-Backup-Dateien ({ format: 'zahlenblitz_profile_backup_v3', profile: ... })
 * - v2-Backup-Dateien ({ format: 'zahlenblitz_profile_backup_v1', profile: ... })
 * - Arrays von Profilen (v2 oder v3)
 * - Einzelne Profilobjekte
 */
export function parseAndImportProfilesJson(rawText: string): {
  success: boolean;
  profiles: UserProfileV3[];
  message: string;
} {
  if (!rawText || !rawText.trim()) {
    return { success: false, profiles: [], message: 'Die Datei ist leer.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    return {
      success: false,
      profiles: [],
      message: 'Ungültiges Dateiformat. Bitte eine gültige JSON-Datei wählen.',
    };
  }

  let candidates: any[] = [];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (parsed.profile && typeof parsed.profile === 'object') {
      candidates = [parsed.profile];
    } else if (Array.isArray(parsed.profiles)) {
      candidates = parsed.profiles;
    } else {
      candidates = [parsed];
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      profiles: [],
      message: 'In der Datei konnten keine Profil-Daten gefunden werden.',
    };
  }

  const convertedProfiles: UserProfileV3[] = candidates.map((c, idx) => {
    // Wenn es bereits ein v3-Profil ist (enthält multFacts als FactFamily[])
    if (
      Array.isArray(c.multFacts) &&
      c.multFacts.length > 0 &&
      'a' in c.multFacts[0] &&
      'b' in c.multFacts[0]
    ) {
      return c as UserProfileV3;
    }
    // Sonst als v2 konvertieren
    return convertV2ProfileToV3(c, idx);
  });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(V3_PROFILES_KEY, JSON.stringify(convertedProfiles));
      window.localStorage.setItem(V3_ACTIVE_PROFILE_KEY, convertedProfiles[0].id);
      setImportPromptStatus('done');
    } catch {}
  }

  return {
    success: true,
    profiles: convertedProfiles,
    message: `${convertedProfiles.length} Spielerprofil(e) erfolgreich aus Datei importiert!`,
  };
}

/**
 * Liest bestehende v2-Profile aus localStorage und konvertiert sie verlustfrei in v3-Profile.
 * ACHTUNG: Die v2-Daten im Browser werden hierbei NIEMALS verändert oder überschrieben!
 */
export function importProfilesFromV2(): {
  success: boolean;
  profiles: UserProfileV3[];
  message: string;
} {
  if (typeof window === 'undefined') {
    return { success: false, profiles: [], message: 'Kein Browser-Kontext.' };
  }

  try {
    const rawV2 = window.localStorage.getItem(V2_PROFILES_KEY);
    if (!rawV2) {
      return {
        success: false,
        profiles: [],
        message: 'Keine v2-Daten im aktuellen Browser gefunden. Nutze den Datei-Import, wenn du ein Backup hast.',
      };
    }

    const parsedV2 = JSON.parse(rawV2);
    if (!Array.isArray(parsedV2) || parsedV2.length === 0) {
      return { success: false, profiles: [], message: 'Keine gültigen v2-Profile gefunden.' };
    }

    const importedProfiles: UserProfileV3[] = parsedV2.map((p, idx) =>
      convertV2ProfileToV3(p, idx)
    );

    // In v3-Storage speichern
    window.localStorage.setItem(V3_PROFILES_KEY, JSON.stringify(importedProfiles));
    window.localStorage.setItem(V3_ACTIVE_PROFILE_KEY, importedProfiles[0].id);
    setImportPromptStatus('done');

    return {
      success: true,
      profiles: importedProfiles,
      message: `${importedProfiles.length} Spielerprofil(e) erfolgreich aus Version 2 importiert!`,
    };
  } catch (err) {
    return {
      success: false,
      profiles: [],
      message: `Fehler beim Import: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
