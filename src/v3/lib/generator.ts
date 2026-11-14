import type {
  DidacticStrategyMult,
  DidacticStrategyPM,
  EquationPartsV3,
  FactFamily,
  GameMode,
  MultVariant,
  PlusMinusVariant,
  TaskVariant,
} from './types';

export const DEFAULT_EASE_FACTOR = 2.5;

export function classifyStrategyPM(a: number, b: number, c: number): DidacticStrategyPM {
  if (c === 10) return 'bonds_10';
  if (a === b) return 'doubles';
  if (Math.abs(a - b) === 1) return 'near_doubles';
  if (c < 10) return 'up_to_10';
  return 'over_10';
}

export function classifyStrategyMult(a: number, b: number, _c: number): DidacticStrategyMult {
  if (a === 1 || a === 10 || b === 1 || b === 10) return 'core_1_10';
  if (a === 2 || a === 5 || b === 2 || b === 5) return 'core_2_5';
  if (a === b) return 'squares';
  if (Math.abs(a - b) === 1) return 'near_squares';
  return 'kings';
}

/**
 * Erzeugt die 100 Faktenfamilien für den Modus "Zahlen-Held" (Summanden 1..10).
 * Jedes Paar (a, b) bildet genau eine Faktenfamilie mit deterministischer didaktischer Strategie.
 */
export function generatePlusMinusFacts(): FactFamily[] {
  const facts: FactFamily[] = [];

  for (let b = 1; b <= 10; b++) {
    for (let a = 1; a <= 10; a++) {
      const c = a + b;
      facts.push({
        id: `pm_${a}_${b}`,
        mode: 'plusminus',
        a,
        b,
        c,
        strategy: classifyStrategyPM(a, b, c),
        repetitions: 0,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        dueDate: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        masteredVariants: [],
      });
    }
  }

  return facts;
}

/**
 * Erzeugt die 100 Faktenfamilien für das kleine 1×1 (Faktoren 1..10).
 */
export function generateMultFacts(): FactFamily[] {
  const facts: FactFamily[] = [];

  for (let b = 1; b <= 10; b++) {
    for (let a = 1; a <= 10; a++) {
      const c = a * b;
      facts.push({
        id: `mult_${a}_${b}`,
        mode: 'mult',
        a,
        b,
        c,
        strategy: classifyStrategyMult(a, b, c),
        repetitions: 0,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        dueDate: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        masteredVariants: [],
      });
    }
  }

  return facts;
}

/**
 * Wählt für eine Faktenfamilie die passende Darstellungsform (TaskVariant):
 * - repetitions === 0: IMMER die Grundaufgabe (Mal bzw. Plus), um Überforderung zu verhindern.
 * - repetitions === 1: 50% Grundaufgabe, 50% Umkehraufgabe (Geteilt bzw. Minus).
 * - repetitions >= 2: Rotation durch alle Varianten, ungelöste Transferformen bevorzugt.
 */
export function selectTaskVariant(fact: FactFamily): TaskVariant {
  if (fact.mode === 'mult') {
    if (fact.repetitions === 0) {
      return 'mult';
    }
    if (fact.repetitions === 1) {
      return Math.random() < 0.5 ? 'mult' : 'div';
    }
    const allMultVariants: MultVariant[] = [
      'mult',
      'div',
      'gap_mult_b',
      'gap_mult_a',
      'gap_div_c',
      'gap_div_a',
    ];
    const unmastered = allMultVariants.filter((v) => !fact.masteredVariants.includes(v));
    if (unmastered.length > 0) {
      return unmastered[Math.floor(Math.random() * unmastered.length)];
    }
    return allMultVariants[Math.floor(Math.random() * allMultVariants.length)];
  }

  // plusminus
  if (fact.repetitions === 0) {
    return 'add';
  }
  if (fact.repetitions === 1) {
    return Math.random() < 0.5 ? 'add' : 'sub';
  }
  const allPmVariants: PlusMinusVariant[] = [
    'add',
    'sub',
    'gap_add_b',
    'gap_add_a',
    'gap_sub_b',
    'gap_sub_c',
  ];
  const unmastered = allPmVariants.filter((v) => !fact.masteredVariants.includes(v));
  if (unmastered.length > 0) {
    return unmastered[Math.floor(Math.random() * unmastered.length)];
  }
  return allPmVariants[Math.floor(Math.random() * allPmVariants.length)];
}

function getAdditionHint(a: number, b: number, c: number): string {
  if (c === 10) {
    return `❤️ Verliebte Zahlen: ${a} und ${b} ergeben zusammen immer 10!`;
  }
  if (a === b) {
    return `⚡ Verdoppeln: ${a} + ${a} = ${c}`;
  }
  if (Math.abs(a - b) === 1) {
    const min = Math.min(a, b);
    return `⚡ Fast-Verdoppeln: Erst ${min} + ${min} = ${min * 2}, plus 1 = ${c}`;
  }
  if (c > 10 && a < 10 && b < 10) {
    const toTen = 10 - a;
    const rest = b - toTen;
    return `💡 Zehnerstopp: Erst ${a} + ${toTen} = 10, dann 10 + ${rest} = ${c}`;
  }
  return `Tauschaufgabe: ${b} + ${a} = ${c}`;
}

/**
 * Formatiert die gewählte Variante einer Faktenfamilie für das UI
 * inklusive korrekter Platzierung der Eingabelücke [ ? ] und didaktischem Hinweis.
 */
export function formatEquationPartsV3(
  fact: FactFamily,
  variant: TaskVariant
): EquationPartsV3 {
  const { a, b, c, mode } = fact;

  if (mode === 'mult') {
    switch (variant as MultVariant) {
      case 'mult':
        return {
          left: `${a} × ${b} =`,
          right: '',
          solution: c,
          prompt: `${a} × ${b} = ?`,
          variant,
          typeBadge: `${b}er-Reihe · Malnehmen`,
          fullEquationWithSolution: `${a} × ${b} = ${c}`,
          hintText:
            a === b
              ? `⚡ Quadratzahl: ${a} × ${a} = ${c}`
              : `Tauschaufgabe: ${b} × ${a} = ${c}`,
          strategyHint:
            a === b
              ? `Quadratzahl: ${a} mal ${a} ergibt ${c}`
              : `Umkehrbar als ${b} × ${a} = ${c}`,
        };
      case 'div':
        return {
          left: `${c} : ${b} =`,
          right: '',
          solution: a,
          prompt: `${c} : ${b} = ?`,
          variant,
          typeBadge: `${b}er-Reihe · Umkehraufgabe`,
          fullEquationWithSolution: `${c} : ${b} = ${a}`,
          hintText: `🔄 Umkehrtrick: Denn ${a} × ${b} = ${c}`,
          strategyHint: `Überlege: Welche Zahl mal ${b} ergibt ${c}? (${a} × ${b} = ${c})`,
        };
      case 'gap_mult_b':
        return {
          left: `${a} ×`,
          right: `= ${c}`,
          solution: b,
          prompt: `${a} × ? = ${c}`,
          variant,
          typeBadge: `${b}er-Reihe · Lücke`,
          fullEquationWithSolution: `${a} × ${b} = ${c}`,
          hintText: `Überlege: ${a} mal wie viel ergibt ${c}?`,
          strategyHint: `Wie oft passt die ${a} in die ${c}? Genau ${b}-mal!`,
        };
      case 'gap_mult_a':
        return {
          left: '',
          right: `× ${b} = ${c}`,
          solution: a,
          prompt: `? × ${b} = ${c}`,
          variant,
          typeBadge: `${b}er-Reihe · Lücke`,
          fullEquationWithSolution: `${a} × ${b} = ${c}`,
          hintText: `Überlege: Wie viel mal ${b} ergibt ${c}?`,
          strategyHint: `Wie oft passt die ${b} in die ${c}? Genau ${a}-mal!`,
        };
      case 'gap_div_c':
        return {
          left: '',
          right: `: ${b} = ${a}`,
          solution: c,
          prompt: `? : ${b} = ${a}`,
          variant,
          typeBadge: `${b}er-Reihe · Geteilt-Lücke`,
          fullEquationWithSolution: `${c} : ${b} = ${a}`,
          hintText: `🔄 Umkehrtrick: Rechne einfach ${a} × ${b} = ${c}`,
          strategyHint: `Multipliziere einfach das Ergebnis mit dem Teiler: ${a} × ${b} = ${c}`,
        };
      case 'gap_div_a':
        return {
          left: `${c} :`,
          right: `= ${a}`,
          solution: b,
          prompt: `${c} : ? = ${a}`,
          variant,
          typeBadge: `${b}er-Reihe · Geteilt-Lücke`,
          fullEquationWithSolution: `${c} : ${b} = ${a}`,
          hintText: `🔄 Umkehrtrick: Denn ${a} × ${b} = ${c}`,
          strategyHint: `Überlege: Durch welche Zahl muss man ${c} teilen, um ${a} zu erhalten? (${b})`,
        };
    }
  }

  // plusminus
  switch (variant as PlusMinusVariant) {
    case 'add':
      return {
        left: `${a} + ${b} =`,
        right: '',
        solution: c,
        prompt: `${a} + ${b} = ?`,
        variant,
        typeBadge:
          c === 10
            ? '❤️ Verliebte Zahlen'
            : c <= 10
              ? 'Plus bis 10'
              : 'Zehnerübergang',
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: getAdditionHint(a, b, c),
        strategyHint: getAdditionHint(a, b, c),
      };
    case 'sub':
      return {
        left: `${c} − ${b} =`,
        right: '',
        solution: a,
        prompt: `${c} − ${b} = ?`,
        variant,
        typeBadge:
          c === 10
            ? '❤️ Verliebte Zahlen · Minus'
            : c > 10 && a < 10
              ? 'Minus über die 10'
              : 'Minus-Aufgabe',
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText:
          c > 10 && a < 10
            ? `💡 Zehnerstopp: Erst ${c} − ${c - 10} = 10, dann noch ${b - (c - 10)} abziehen = ${a}`
            : `🔄 Umkehrtrick: Denn ${a} + ${b} = ${c}`,
        strategyHint:
          c > 10 && a < 10
            ? `Erst zurück zur 10 (${c} − ${c - 10} = 10), dann den Rest abziehen: Ergebnis ${a}`
            : `Denke an die Plusaufgabe: ${a} + ${b} = ${c}`,
      };
    case 'gap_add_b':
      return {
        left: `${a} +`,
        right: `= ${c}`,
        solution: b,
        prompt: `${a} + ? = ${c}`,
        variant,
        typeBadge: c === 10 ? '❤️ Verliebte Zahlen · Lücke' : `Ergänzen bis ${c}`,
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: `Von ${a} bis ${c} fehlen ${b} (${c} − ${a} = ${b})`,
        strategyHint: `Wie viel fehlt von der ${a} bis zur ${c}? Es fehlen ${b}!`,
      };
    case 'gap_add_a':
      return {
        left: '',
        right: `+ ${b} = ${c}`,
        solution: a,
        prompt: `? + ${b} = ${c}`,
        variant,
        typeBadge: c === 10 ? '❤️ Verliebte Zahlen · Lücke' : `Plus-Lücke`,
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: `🔄 Umkehrtrick: Rechne ${c} − ${b} = ${a}`,
        strategyHint: `Ziehe von der Summe ${c} den zweiten Summanden ${b} ab: ${a}`,
      };
    case 'gap_sub_b':
      return {
        left: `${c} −`,
        right: `= ${a}`,
        solution: b,
        prompt: `${c} − ? = ${a}`,
        variant,
        typeBadge: 'Minus-Lücke',
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText: `Unterschied zwischen ${c} und ${a} ist ${b}`,
        strategyHint: `Wie viel muss man von ${c} wegnehmen, um bei ${a} zu landen? Genau ${b}!`,
      };
    case 'gap_sub_c':
      return {
        left: '',
        right: `− ${b} = ${a}`,
        solution: c,
        prompt: `? − ${b} = ${a}`,
        variant,
        typeBadge: 'Minus-Lücke',
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText: `🔄 Umkehrtrick: Rechne einfach ${a} + ${b} = ${c}`,
        strategyHint: `Addiere den Rest und den Abzug: ${a} + ${b} = ${c}`,
      };
  }
}
