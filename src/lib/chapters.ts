import { getCardMastery, getMatrixCellStatus } from './sm2';
import { smartShuffle } from './storage';
import type { GameMode, PlusMinusFocus, TaskCard } from './types';

export interface StarProgress {
  current: number;
  consolidated: number;
  total: number;
  percent: number;
  isUnlocked: boolean;
  isAchieved: boolean;
}

export interface WorldChapter {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  rows?: number[];
  pmFocus?: PlusMinusFocus;
  stars: 0 | 1 | 2 | 3;
  percent: number;
  totalCards: number;
  masteredCards: number;
  statusText: string;
  star1Desc: string;
  star2Desc: string;
  star3Desc: string;
  star1Progress: StarProgress;
  star2Progress: StarProgress;
  star3Progress: StarProgress;
}

/**
 * Gibt die 3 didaktischen Welten zurück.
 */
export function getWorldChapters(
  cards: TaskCard[],
  gameMode: GameMode
): WorldChapter[] {
  if (gameMode === 'mult') {
    return [
      buildMultChapter(
        'mult_1',
        'Insel der Kernreihen',
        '🏝️',
        'Reihen 1, 2, 5, 10',
        [1, 2, 5, 10],
        cards,
        'Kernreihen malnehmen (z. B. 2 × 5)',
        'Umkehraufgaben geteilt (z. B. 10 : 2)',
        'Lückenaufgaben (z. B. 2 × ? = 10)'
      ),
      buildMultChapter(
        'mult_2',
        'Tal der Quadratzahlen',
        '🌋',
        'Reihen 3, 4, 6',
        [3, 4, 6],
        cards,
        'Reihen 3, 4, 6 malnehmen (z. B. 4 × 4)',
        'Umkehraufgaben geteilt (z. B. 16 : 4)',
        'Lückenaufgaben (z. B. 4 × ? = 16)'
      ),
      buildMultChapter(
        'mult_3',
        'Meister-Gipfel',
        '🏰',
        'Reihen 7, 8, 9',
        [7, 8, 9],
        cards,
        'Königsreihen 7, 8, 9 malnehmen (z. B. 7 × 8)',
        'Schwere Geteiltaufgaben (z. B. 56 : 7)',
        'Meister-Lücken (z. B. 7 × ? = 56)'
      ),
    ];
  }

  // Zahlenheld (Plus & Minus bis 20)
  return [
    buildPlusMinusChapter(
      'pm_1',
      'Insel der Zehnerfreunde',
      '❤️',
      'Partnerzahlen zur 10',
      'number_bonds_10',
      cards.filter((c) => c.fact[2] === 10),
      'Ergänzen & Plus zur 10 (z. B. 3 + ? = 10)',
      'Minus von der 10 (z. B. 10 − 3 = ?)',
      'Minus-Lücken (z. B. 10 − ? = 3)'
    ),
    buildPlusMinusChapter(
      'pm_2',
      'Tal der Doppelgänger',
      '⚡',
      'Verdoppeln & Nachbarn',
      'doubles',
      cards.filter(
        (c) =>
          c.fact[0] === c.fact[1] || Math.abs(c.fact[0] - c.fact[1]) === 1
      ),
      'Reines Verdoppeln (z. B. 4 + 4 = 8)',
      'Nachbaraufgaben & Halbieren (z. B. 4 + 5, 14 − 7)',
      'Lückenaufgaben (z. B. ? + 7 = 14)'
    ),
    buildPlusMinusChapter(
      'pm_3',
      'Zehner-Gipfel',
      '🚀',
      'Zehnerübergang bis 20',
      'over_10',
      cards.filter((c) => c.fact[2] > 10),
      'Plus mit Zehnerübergang (z. B. 8 + 5 = 13)',
      'Minus unter die 10 (z. B. 13 − 5 = 8)',
      'Lückenaufgaben (z. B. 8 + ? = 13)'
    ),
  ];
}

function buildMultChapter(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  rows: number[],
  allCards: TaskCard[],
  star1Desc: string,
  star2Desc: string,
  star3Desc: string
): WorldChapter {
  const chapterCards = allCards.filter((c) => rows.includes(c.row));
  return computeChapterStats(
    id,
    title,
    icon,
    subtitle,
    chapterCards,
    rows,
    undefined,
    star1Desc,
    star2Desc,
    star3Desc
  );
}

function buildPlusMinusChapter(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  pmFocus: PlusMinusFocus,
  chapterCards: TaskCard[],
  star1Desc: string,
  star2Desc: string,
  star3Desc: string
): WorldChapter {
  return computeChapterStats(
    id,
    title,
    icon,
    subtitle,
    chapterCards,
    undefined,
    pmFocus,
    star1Desc,
    star2Desc,
    star3Desc
  );
}

function computeChapterStats(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  chapterCards: TaskCard[],
  rows?: number[],
  pmFocus?: PlusMinusFocus,
  star1Desc = '',
  star2Desc = '',
  star3Desc = ''
): WorldChapter {
  const totalCards = chapterCards.length || 1;
  const masteredCards = chapterCards.filter(
    (c) => getCardMastery(c) === 'mastered'
  ).length;

  const countMastered = (list: TaskCard[]) =>
    list.filter((c) => getCardMastery(c) === 'mastered').length;

  // Gelernt: Karte wurde mindestens 1x richtig gelöst und hat keinen akuten Fehler
  const countLearned = (list: TaskCard[]) =>
    list.filter((c) => c.repetitions >= 1 && (c.lastQuality ?? 0) >= 2).length;

  // Fest im Langzeitgedächtnis: Mindestens 2 getrennte Bestätigungen mit gutem Tempo
  const countConsolidated = (list: TaskCard[]) =>
    list.filter((c) => c.repetitions >= 2 && (c.lastQuality ?? 0) >= 3).length;

  let s1Cards: TaskCard[] = [];
  let s2Cards: TaskCard[] = [];
  let s3Cards: TaskCard[] = [];

  if (pmFocus === 'number_bonds_10') {
    s1Cards = chapterCards.filter(
      (c) => c.type === 'add' || c.type === 'gap_add_a' || c.type === 'gap_add_b'
    );
    s2Cards = chapterCards.filter((c) => c.type === 'sub');
    s3Cards = chapterCards.filter(
      (c) => c.type === 'gap_sub_b' || c.type === 'gap_sub_c'
    );
  } else {
    s1Cards = chapterCards.filter(
      (c) => c.type === 'mult' || c.type === 'add'
    );
    s2Cards = chapterCards.filter(
      (c) => c.type === 'div' || c.type === 'sub'
    );
    s3Cards = chapterCards.filter((c) => c.type.startsWith('gap_'));
  }

  const s1Total = s1Cards.length || 1;
  const s1Learned = countLearned(s1Cards);
  const s1Consolidated = countConsolidated(s1Cards);
  const s1Percent = Math.min(100, Math.round((s1Learned / s1Total) * 100));
  const s1Achieved = s1Percent >= 80 && s1Learned >= 1;

  const star1Progress: StarProgress = {
    current: s1Learned,
    consolidated: s1Consolidated,
    total: s1Total,
    percent: s1Percent,
    isUnlocked: true,
    isAchieved: s1Achieved,
  };

  const s2Total = s2Cards.length || 1;
  const s2Learned = countLearned(s2Cards);
  const s2Consolidated = countConsolidated(s2Cards);
  const s2Percent = Math.min(100, Math.round((s2Learned / s2Total) * 100));
  const s2Unlocked = s1Achieved;
  const s2Achieved = s2Unlocked && s2Percent >= 80 && s2Learned >= 1;

  const star2Progress: StarProgress = {
    current: s2Learned,
    consolidated: s2Consolidated,
    total: s2Total,
    percent: s2Percent,
    isUnlocked: s2Unlocked,
    isAchieved: s2Achieved,
  };

  const s3Total = s3Cards.length || 1;
  const s3Learned = countLearned(s3Cards);
  const s3Consolidated = countConsolidated(s3Cards);
  const s3Percent = Math.min(100, Math.round((s3Learned / s3Total) * 100));
  const s3Unlocked = s2Achieved;
  const s3Achieved = s3Unlocked && s3Percent >= 80 && s3Learned >= 1;

  const star3Progress: StarProgress = {
    current: s3Learned,
    consolidated: s3Consolidated,
    total: s3Total,
    percent: s3Percent,
    isUnlocked: s3Unlocked,
    isAchieved: s3Achieved,
  };

  let stars: 0 | 1 | 2 | 3 = 0;
  if (s3Achieved) stars = 3;
  else if (s2Achieved) stars = 2;
  else if (s1Achieved) stars = 1;

  // Der Prozentwert auf der Welt-Kachel deckt sich 1:1 mit der aktuellen Stufe:
  // - 0 Sterne: Zeigt Fortschritt zu Stern 1 (0..100%)
  // - 1 Stern:  Zeigt Fortschritt zu Stern 2 (0..100%)
  // - 2 Sterne: Zeigt Fortschritt zu Stern 3 (0..100%)
  // - 3 Sterne: 100% gemeistert
  let percent = 0;
  if (stars === 3) {
    percent = 100;
  } else if (stars === 2) {
    percent = s3Percent;
  } else if (stars === 1) {
    percent = s2Percent;
  } else {
    percent = s1Percent;
  }

  let statusText = 'Neu erkunden';
  if (stars === 3) statusText = 'Gemeistert! ⭐⭐⭐';
  else if (stars === 2) statusText = `Stufe 3: ${s3Learned}/${s3Total} gelernt (${s3Percent}%)`;
  else if (stars === 1) statusText = `Stufe 2: ${s2Learned}/${s2Total} gelernt (${s2Percent}%)`;
  else if (s1Learned > 0) statusText = `Stufe 1: ${s1Learned}/${s1Total} gelernt (${s1Percent}%)`;
  else statusText = 'Noch unentdeckt';

  return {
    id,
    title,
    icon,
    subtitle,
    rows,
    pmFocus,
    stars,
    percent,
    totalCards,
    masteredCards,
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
 * Erstellt eine intelligente, stufenbasierte Übungsrunde für eine Rechenwelt.
 * Steigt automatisch mit den verdienten Sternen auf:
 * - 0 Sterne -> Stufe 1: Grundaufgaben
 * - 1 Stern  -> Stufe 2: Umkehraufgaben + Wiederholungen
 * - 2 Sterne -> Stufe 3: Lückenaufgaben & Meisteraufgaben
 */
export function buildChapterSessionQueue(
  allCards: TaskCard[],
  chapter: WorldChapter,
  sessionSize = 12
): TaskCard[] {
  let relevantCards: TaskCard[] = [];

  if (chapter.rows && chapter.rows.length > 0) {
    relevantCards = allCards.filter((c) => chapter.rows!.includes(c.row));
  } else if (chapter.pmFocus) {
    if (chapter.pmFocus === 'number_bonds_10') {
      relevantCards = allCards.filter((c) => c.fact[2] === 10);
    } else if (chapter.pmFocus === 'doubles') {
      relevantCards = allCards.filter(
        (c) =>
          c.fact[0] === c.fact[1] || Math.abs(c.fact[0] - c.fact[1]) === 1
      );
    } else if (chapter.pmFocus === 'over_10') {
      relevantCards = allCards.filter((c) => c.fact[2] > 10);
    }
  }

  let primaryTargetCards: TaskCard[] = [];
  let secondaryCards: TaskCard[] = [];

  if (chapter.pmFocus === 'number_bonds_10') {
    const gapAdd = relevantCards.filter(
      (c) => c.type === 'add' || c.type === 'gap_add_a' || c.type === 'gap_add_b'
    );
    const sub = relevantCards.filter((c) => c.type === 'sub');
    const gapSub = relevantCards.filter(
      (c) => c.type === 'gap_sub_b' || c.type === 'gap_sub_c'
    );

    if (chapter.stars === 0) {
      // Stufe 1: Ergänzen zur 10 (3 + ? = 10)
      primaryTargetCards = gapAdd;
    } else if (chapter.stars === 1) {
      // Stufe 2: Subtraktion von 10 (10 - 3 = ?), gemischt mit Ergänzen
      primaryTargetCards = sub;
      secondaryCards = gapAdd;
    } else {
      // Stufe 3: Minus-Lücken (10 - ? = 3) & volle Mischung
      primaryTargetCards = gapSub;
      secondaryCards = [...gapAdd, ...sub];
    }
  } else if (chapter.rows) {
    // 1x1 Welten
    const mult = relevantCards.filter((c) => c.type === 'mult');
    const div = relevantCards.filter((c) => c.type === 'div');
    const gaps = relevantCards.filter((c) => c.type.startsWith('gap_'));

    if (chapter.stars === 0) {
      primaryTargetCards = mult;
    } else if (chapter.stars === 1) {
      primaryTargetCards = div;
      secondaryCards = mult;
    } else {
      primaryTargetCards = gaps;
      secondaryCards = [...mult, ...div];
    }
  } else {
    // Andere Zahlenheld Welten
    const add = relevantCards.filter((c) => c.type === 'add');
    const sub = relevantCards.filter((c) => c.type === 'sub');
    const gaps = relevantCards.filter((c) => c.type.startsWith('gap_'));

    if (chapter.stars === 0) {
      primaryTargetCards = add;
    } else if (chapter.stars === 1) {
      primaryTargetCards = sub;
      secondaryCards = add;
    } else {
      primaryTargetCards = gaps;
      secondaryCards = [...add, ...sub];
    }
  }

  // Fällige und ungelernte Karten bevorzugen
  const due = primaryTargetCards.filter(
    (c) =>
      c.totalAttempts > 0 &&
      (c.dueDate <= Date.now() || c.repetitions === 0)
  );
  const unlearned = primaryTargetCards.filter((c) => c.totalAttempts === 0);
  const masteredPrimary = primaryTargetCards.filter(
    (c) => getCardMastery(c) === 'mastered'
  );

  const selected: TaskCard[] = [];

  // 1. Fällige Karten des aktuellen Ziellevels
  selected.push(...due.slice(0, Math.ceil(sessionSize * 0.6)));

  // 2. Ungelernte Karten des aktuellen Ziellevels
  const neededForNew = sessionSize - selected.length;
  const shuffledUnlearned = [...unlearned].sort(() => Math.random() - 0.5);
  selected.push(...shuffledUnlearned.slice(0, neededForNew));

  // 3. Sekundärkarten (vorherige Stufen auffrischen)
  if (selected.length < sessionSize && secondaryCards.length > 0) {
    const shuffledSec = [...secondaryCards].sort(() => Math.random() - 0.5);
    selected.push(...shuffledSec.slice(0, sessionSize - selected.length));
  }

  // 4. Bereits gemeisterte Karten des Ziellevels
  if (selected.length < sessionSize && masteredPrimary.length > 0) {
    const shuffledMastered = [...masteredPrimary].sort(() => Math.random() - 0.5);
    selected.push(...shuffledMastered.slice(0, sessionSize - selected.length));
  }

  // 5. Auffüllen mit beliebigen relevanten Karten
  if (selected.length < sessionSize) {
    const rest = relevantCards.filter((c) => !selected.includes(c));
    selected.push(...rest.slice(0, sessionSize - selected.length));
  }

  return smartShuffle(selected);
}
