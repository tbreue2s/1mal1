import { getFactMastery } from './sm2';
import type { FactFamily, GameMode, TaskVariant } from './types';

export interface StarProgressV3 {
  current: number;
  total: number;
  percent: number;
  isUnlocked: boolean;
  isAchieved: boolean;
}

export interface WorldChapterV3 {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  mode: GameMode;
  facts: FactFamily[];
  stars: 0 | 1 | 2 | 3;
  percent: number;
  totalFacts: number;
  masteredFacts: number;
  statusText: string;
  star1Desc: string;
  star2Desc: string;
  star3Desc: string;
  star1Progress: StarProgressV3;
  star2Progress: StarProgressV3;
  star3Progress: StarProgressV3;
}

export interface QueuedTaskV3 {
  fact: FactFamily;
  variant: TaskVariant;
}

export function getWorldChaptersV3(
  facts: FactFamily[],
  mode: GameMode
): WorldChapterV3[] {
  if (mode === 'mult') {
    return [
      buildMultChapterV3(
        'mult_1',
        'Insel der Kernreihen',
        '🏝️',
        'Reihen 1, 2, 5, 10',
        facts.filter(
          (f) =>
            f.a === 1 ||
            f.a === 2 ||
            f.a === 5 ||
            f.a === 10 ||
            f.b === 1 ||
            f.b === 2 ||
            f.b === 5 ||
            f.b === 10
        ),
        'Kernreihen malnehmen (z. B. 2 × 5)',
        'Umkehraufgaben geteilt (z. B. 10 : 2)',
        'Lückenaufgaben (z. B. 2 × ? = 10)'
      ),
      buildMultChapterV3(
        'mult_2',
        'Tal der Quadratzahlen & Nachbarn',
        '🌋',
        'Quadratzahlen & Reihen 3, 4, 6',
        facts.filter(
          (f) =>
            (f.a === f.b ||
              f.strategy === 'near_squares' ||
              [3, 4, 6].includes(f.b)) &&
            !(f.a === 1 || f.a === 10 || f.b === 1 || f.b === 10)
        ),
        'Quadratzahlen & Reihen 3, 4, 6 malnehmen',
        'Umkehraufgaben geteilt (z. B. 16 : 4)',
        'Lückenaufgaben (z. B. 4 × ? = 16)'
      ),
      buildMultChapterV3(
        'mult_3',
        'Meister-Gipfel der Königsreihen',
        '🏰',
        'Königsaufgaben (7, 8, 9)',
        facts.filter(
          (f) =>
            [7, 8, 9].includes(f.a) &&
            [7, 8, 9].includes(f.b)
        ),
        'Königsreihen malnehmen (z. B. 7 × 8)',
        'Schwere Geteiltaufgaben (z. B. 56 : 7)',
        'Meister-Lücken (z. B. 7 × ? = 56)'
      ),
    ];
  }

  // plusminus (Zahlen-Held) – 100% lückenlose Abdeckung!
  return [
    buildPlusMinusChapterV3(
      'pm_1',
      'Insel der Zehner-Basis',
      '🏝️',
      'Alle Zerlegungen bis 10',
      facts.filter((f) => f.c <= 10),
      'Plusaufgaben bis 10 (z. B. 3 + 5, 2 + 8)',
      'Umkehraufgaben Minus (z. B. 8 − 5, 10 − 3)',
      'Ergänzen & Lücken (z. B. 3 + ? = 10)'
    ),
    buildPlusMinusChapterV3(
      'pm_2',
      'Tal der Doppelgänger',
      '⚡',
      'Verdoppeln & Nachbarn bis 20',
      facts.filter(
        (f) =>
          f.c > 10 &&
          (f.a === f.b || Math.abs(f.a - f.b) === 1)
      ),
      'Verdoppeln bis 20 (z. B. 6 + 6, 7 + 7)',
      'Halbieren / Minus (z. B. 14 − 7, 16 − 8)',
      'Nachbarn & Lücken (z. B. 6 + 7, ? + 7 = 14)'
    ),
    buildPlusMinusChapterV3(
      'pm_3',
      'Zehner-Gipfel',
      '🚀',
      'Zehnerübergang bis 20',
      facts.filter(
        (f) =>
          f.c > 10 &&
          f.a !== f.b &&
          Math.abs(f.a - f.b) > 1
      ),
      'Plus mit Zehnerstopp (z. B. 8 + 5 = 13)',
      'Minus unter die 10 (z. B. 13 − 5 = 8)',
      'Meister-Lücken (z. B. 8 + ? = 13)'
    ),
  ];
}

function buildMultChapterV3(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  chapterFacts: FactFamily[],
  star1Desc: string,
  star2Desc: string,
  star3Desc: string
): WorldChapterV3 {
  return computeChapterStatsV3(
    id,
    title,
    icon,
    subtitle,
    'mult',
    chapterFacts,
    star1Desc,
    star2Desc,
    star3Desc
  );
}

function buildPlusMinusChapterV3(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  chapterFacts: FactFamily[],
  star1Desc: string,
  star2Desc: string,
  star3Desc: string
): WorldChapterV3 {
  return computeChapterStatsV3(
    id,
    title,
    icon,
    subtitle,
    'plusminus',
    chapterFacts,
    star1Desc,
    star2Desc,
    star3Desc
  );
}

function computeChapterStatsV3(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  mode: GameMode,
  chapterFacts: FactFamily[],
  star1Desc: string,
  star2Desc: string,
  star3Desc: string
): WorldChapterV3 {
  const totalFacts = chapterFacts.length || 1;

  // Stufe 1: Fakt wurde mindestens 1x richtig gelöst (repetitions >= 1)
  const s1Learned = chapterFacts.filter(
    (f) => f.repetitions >= 1 && (f.lastQuality ?? 0) >= 2
  ).length;
  const s1Percent = Math.min(100, Math.round((s1Learned / totalFacts) * 100));
  const s1Achieved = s1Percent >= 80 && s1Learned >= 1;

  const star1Progress: StarProgressV3 = {
    current: s1Learned,
    total: totalFacts,
    percent: s1Percent,
    isUnlocked: true,
    isAchieved: s1Achieved,
  };

  // Stufe 2: Umkehraufgabe gemeistert (div bzw. sub in masteredVariants)
  const targetInverse = mode === 'mult' ? 'div' : 'sub';
  const s2Learned = chapterFacts.filter((f) =>
    f.masteredVariants.includes(targetInverse)
  ).length;
  const s2Percent = Math.min(100, Math.round((s2Learned / totalFacts) * 100));
  const s2Unlocked = s1Achieved;
  const s2Achieved = s2Unlocked && s2Percent >= 80 && s2Learned >= 1;

  const star2Progress: StarProgressV3 = {
    current: s2Learned,
    total: totalFacts,
    percent: s2Percent,
    isUnlocked: s2Unlocked,
    isAchieved: s2Achieved,
  };

  // Stufe 3: Lückenaufgabe gemeistert
  const s3Learned = chapterFacts.filter((f) =>
    f.masteredVariants.some((v) => v.startsWith('gap_'))
  ).length;
  const s3Percent = Math.min(100, Math.round((s3Learned / totalFacts) * 100));
  const s3Unlocked = s2Achieved;
  const s3Achieved = s3Unlocked && s3Percent >= 80 && s3Learned >= 1;

  const star3Progress: StarProgressV3 = {
    current: s3Learned,
    total: totalFacts,
    percent: s3Percent,
    isUnlocked: s3Unlocked,
    isAchieved: s3Achieved,
  };

  let stars: 0 | 1 | 2 | 3 = 0;
  if (s3Achieved) stars = 3;
  else if (s2Achieved) stars = 2;
  else if (s1Achieved) stars = 1;

  let percent = 0;
  if (stars === 3) percent = 100;
  else if (stars === 2) percent = s3Percent;
  else if (stars === 1) percent = s2Percent;
  else percent = s1Percent;

  let statusText = 'Noch unentdeckt';
  if (stars === 3) statusText = 'Gemeistert! ⭐⭐⭐';
  else if (stars === 2) statusText = `Stufe 3: ${s3Learned}/${totalFacts} gemeistert (${s3Percent}%)`;
  else if (stars === 1) statusText = `Stufe 2: ${s2Learned}/${totalFacts} gemeistert (${s2Percent}%)`;
  else if (s1Learned > 0) statusText = `Stufe 1: ${s1Learned}/${totalFacts} gelernt (${s1Percent}%)`;

  const masteredFacts = chapterFacts.filter(
    (f) => getFactMastery(f) === 'mastered'
  ).length;

  return {
    id,
    title,
    icon,
    subtitle,
    mode,
    facts: chapterFacts,
    stars,
    percent,
    totalFacts,
    masteredFacts,
    statusText,
    star1Desc,
    star2Desc,
    star3Desc,
    star1Progress,
    star2Progress,
    star3Progress,
  };
}

/**
 * Erstellt eine intelligente Übungsrunde für eine bestimmte Rechenwelt.
 * Passt die Abfrage-Variante automatisch an das aktuelle Sternen-Level der Welt an.
 */
export function buildChapterSessionQueueV3(
  chapter: WorldChapterV3,
  sessionSize = 10
): QueuedTaskV3[] {
  const pool = [...chapter.facts];

  // Fällige oder fehlerhafte Fakten priorisieren
  const due = pool.filter(
    (f) => f.totalAttempts > 0 && (f.dueDate <= Date.now() || f.repetitions === 0)
  );
  const unlearned = pool.filter((f) => f.totalAttempts === 0);
  const mastered = pool.filter((f) => getFactMastery(f) === 'mastered');

  const selectedFacts: FactFamily[] = [];

  // 1. Bis zu 60% fällige Aufgaben
  const maxDue = Math.min(due.length, Math.ceil(sessionSize * 0.6));
  selectedFacts.push(...due.slice(0, maxDue));

  // 2. Neue Aufgaben
  const neededForNew = sessionSize - selectedFacts.length;
  const shuffledUnlearned = [...unlearned].sort(() => Math.random() - 0.5);
  selectedFacts.push(...shuffledUnlearned.slice(0, neededForNew));

  // 3. Mit Wiederholungen auffüllen
  if (selectedFacts.length < sessionSize && mastered.length > 0) {
    const shuffledMastered = [...mastered].sort(() => Math.random() - 0.5);
    selectedFacts.push(...shuffledMastered.slice(0, sessionSize - selectedFacts.length));
  }

  // 4. Notfall-Auffüllen
  if (selectedFacts.length < sessionSize) {
    const rest = pool.filter((f) => !selectedFacts.includes(f));
    selectedFacts.push(...rest.slice(0, sessionSize - selectedFacts.length));
  }

  // Mischen
  const shuffled = selectedFacts.sort(() => Math.random() - 0.5);

  // Variante gemäß dem Sternenlevel des Kapitels zuordnen:
  return shuffled.map((fact) => {
    let variant: TaskVariant;
    if (chapter.stars === 0) {
      variant = fact.mode === 'mult' ? 'mult' : 'add';
    } else if (chapter.stars === 1) {
      variant = fact.mode === 'mult' ? 'div' : 'sub';
    } else {
      // Stufe 3: Lückenaufgabe
      variant = fact.mode === 'mult' ? 'gap_mult_b' : 'gap_add_b';
    }
    return { fact, variant };
  });
}
