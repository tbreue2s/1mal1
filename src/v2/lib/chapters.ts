import type { GameMode, PlusMinusFocus, TaskCard } from '../../lib/types';
import { getCardMastery } from '../../lib/sm2';

export interface WorldChapter {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  rows?: number[];
  pmFocus?: PlusMinusFocus;
  stars: 0 | 1 | 2 | 3;
  percent: number; // 0..100
  totalCards: number;
  masteredCards: number;
  statusText: string;
}

export function getWorldChapters(
  cards: TaskCard[],
  mode: GameMode
): WorldChapter[] {
  if (mode === 'mult') {
    return [
      buildMultChapter(
        'mult_1',
        'Insel der Kernreihen',
        '🏝️',
        'Reihen 1, 2, 5, 10',
        [1, 2, 5, 10],
        cards
      ),
      buildMultChapter(
        'mult_2',
        'Tal der Quadratzahlen',
        '🌋',
        'Reihen 3, 4, 6',
        [3, 4, 6],
        cards
      ),
      buildMultChapter(
        'mult_3',
        'Meister-Gipfel',
        '🏰',
        'Reihen 7, 8, 9',
        [7, 8, 9],
        cards
      ),
    ];
  }

  // Zahlenheld (Plus & Minus bis 20)
  return [
    buildPlusMinusChapter(
      'pm_1',
      'Insel der Zehnerfreunde',
      '❤️',
      'Verliebte Zahlen & bis 10',
      'number_bonds_10',
      cards.filter((c) => c.fact[2] <= 10)
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
      )
    ),
    buildPlusMinusChapter(
      'pm_3',
      'Zehner-Gipfel',
      '🚀',
      'Zehnerübergang bis 20',
      'over_10',
      cards.filter((c) => c.fact[2] > 10)
    ),
  ];
}

function buildMultChapter(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  rows: number[],
  allCards: TaskCard[]
): WorldChapter {
  const chapterCards = allCards.filter((c) => rows.includes(c.row));
  return computeChapterStats(id, title, icon, subtitle, chapterCards, rows);
}

function buildPlusMinusChapter(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  pmFocus: PlusMinusFocus,
  chapterCards: TaskCard[]
): WorldChapter {
  return computeChapterStats(
    id,
    title,
    icon,
    subtitle,
    chapterCards,
    undefined,
    pmFocus
  );
}

function computeChapterStats(
  id: string,
  title: string,
  icon: string,
  subtitle: string,
  chapterCards: TaskCard[],
  rows?: number[],
  pmFocus?: PlusMinusFocus
): WorldChapter {
  const totalCards = chapterCards.length || 1;
  const masteredCards = chapterCards.filter(
    (c) => getCardMastery(c) === 'mastered'
  ).length;
  const percent = Math.min(
    100,
    Math.round((masteredCards / totalCards) * 100)
  );

  // 3-Sterne-Berechnung nach Aufgabentypen
  const basicCards = chapterCards.filter(
    (c) => c.type === 'mult' || c.type === 'add'
  );
  const inverseCards = chapterCards.filter(
    (c) => c.type === 'div' || c.type === 'sub'
  );
  const gapCards = chapterCards.filter((c) => c.type.startsWith('gap_'));

  const countMastered = (list: TaskCard[]) =>
    list.filter((c) => getCardMastery(c) === 'mastered').length;

  const star1Achieved =
    basicCards.length > 0 &&
    countMastered(basicCards) / basicCards.length >= 0.6;
  const star2Achieved =
    star1Achieved &&
    inverseCards.length > 0 &&
    countMastered(inverseCards) / inverseCards.length >= 0.6;
  const star3Achieved =
    star2Achieved &&
    gapCards.length > 0 &&
    countMastered(gapCards) / gapCards.length >= 0.6;

  let stars: 0 | 1 | 2 | 3 = 0;
  if (star3Achieved) stars = 3;
  else if (star2Achieved) stars = 2;
  else if (star1Achieved) stars = 1;

  let statusText = 'Neu erkunden';
  if (stars === 3) statusText = 'Gemeistert! ⭐⭐⭐';
  else if (stars === 2) statusText = 'Lücken freischalten';
  else if (stars === 1) statusText = 'Geteilt freischalten';
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
  };
}
