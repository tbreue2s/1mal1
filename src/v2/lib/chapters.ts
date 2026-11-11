import { getCardMastery, getMatrixCellStatus } from '../../lib/sm2';
import type { GameMode, PlusMinusFocus, TaskCard } from '../../lib/types';

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
      'Ergänzen zur 10 (z. B. 3 + ? = 10)',
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
  let totalFacts = 0;
  let masteredFacts = 0;

  if (rows && rows.length > 0) {
    totalFacts = rows.length * 10;
    for (const r of rows) {
      for (let a = 1; a <= 10; a++) {
        const cellCards = chapterCards.filter(
          (c) => c.fact[0] === a && c.fact[1] === r
        );
        if (getMatrixCellStatus(cellCards) === 'mastered') {
          masteredFacts++;
        }
      }
    }
  } else {
    const factKeys = Array.from(
      new Set(chapterCards.map((c) => `${c.fact[0]}_${c.fact[1]}`))
    );
    totalFacts = factKeys.length || 1;
    for (const key of factKeys) {
      const [a, b] = key.split('_').map(Number);
      const cellCards = chapterCards.filter(
        (c) => c.fact[0] === a && c.fact[1] === b
      );
      if (getMatrixCellStatus(cellCards) === 'mastered') {
        masteredFacts++;
      }
    }
  }

  const percent = Math.min(
    100,
    Math.round((masteredFacts / (totalFacts || 1)) * 100)
  );

  const totalCards = chapterCards.length || 1;
  const masteredCards = chapterCards.filter(
    (c) => getCardMastery(c) === 'mastered'
  ).length;

  const countMastered = (list: TaskCard[]) =>
    list.filter((c) => getCardMastery(c) === 'mastered').length;

  let star1Achieved = false;
  let star2Achieved = false;
  let star3Achieved = false;

  if (pmFocus === 'number_bonds_10') {
    // Spezialfall Verliebte Zahlen:
    // Stern 1: Ergänzen zur 10 (gap_add_a, gap_add_b)
    const gapAddCards = chapterCards.filter(
      (c) => c.type === 'gap_add_a' || c.type === 'gap_add_b'
    );
    // Stern 2: Minus von 10 (sub)
    const subCards = chapterCards.filter((c) => c.type === 'sub');
    // Stern 3: Minus-Lücken (gap_sub_b, gap_sub_c)
    const gapSubCards = chapterCards.filter(
      (c) => c.type === 'gap_sub_b' || c.type === 'gap_sub_c'
    );

    star1Achieved =
      gapAddCards.length > 0 &&
      countMastered(gapAddCards) / gapAddCards.length >= 0.6;
    star2Achieved =
      star1Achieved &&
      subCards.length > 0 &&
      countMastered(subCards) / subCards.length >= 0.6;
    star3Achieved =
      star2Achieved &&
      gapSubCards.length > 0 &&
      countMastered(gapSubCards) / gapSubCards.length >= 0.6;
  } else {
    // 3-Sterne-Berechnung nach Aufgabentypen für Multiplikation und Standard-Plusminus
    const basicCards = chapterCards.filter(
      (c) => c.type === 'mult' || c.type === 'add'
    );
    const inverseCards = chapterCards.filter(
      (c) => c.type === 'div' || c.type === 'sub'
    );
    const gapCards = chapterCards.filter((c) => c.type.startsWith('gap_'));

    star1Achieved =
      basicCards.length > 0 &&
      countMastered(basicCards) / basicCards.length >= 0.6;
    star2Achieved =
      star1Achieved &&
      inverseCards.length > 0 &&
      countMastered(inverseCards) / inverseCards.length >= 0.6;
    star3Achieved =
      star2Achieved &&
      gapCards.length > 0 &&
      countMastered(gapCards) / gapCards.length >= 0.6;
  }

  let stars: 0 | 1 | 2 | 3 = 0;
  if (star3Achieved) stars = 3;
  else if (star2Achieved) stars = 2;
  else if (star1Achieved) stars = 1;

  let statusText = 'Neu erkunden';
  if (stars === 3) statusText = 'Gemeistert! ⭐⭐⭐';
  else if (stars === 2) statusText = 'Stufe 3 freischalten';
  else if (stars === 1) statusText = 'Stufe 2 freischalten';
  else if (percent > 0) statusText = `${percent}% gelernt`;

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
      (c) => c.type === 'gap_add_a' || c.type === 'gap_add_b'
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

  return selected.sort(() => Math.random() - 0.5);
}
