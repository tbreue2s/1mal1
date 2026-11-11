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
