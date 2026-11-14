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

export function getMultiplicationStrategyHint(a: number, b: number, c: number): string {
  if (a === 1 || b === 1) {
    return `💡 Kernaufgabe: Mal 1 bleibt immer die Zahl selbst (${a} × ${b} = ${c})!`;
  }
  if (a === 2 || b === 2) {
    const other = a === 2 ? b : a;
    return `⚡ Kernaufgabe Verdoppeln: 2 × ${other} ist einfach das Doppelte (${other} + ${other} = ${c})!`;
  }
  if (a === 5 || b === 5) {
    const other = a === 5 ? b : a;
    return `⭐ Kernaufgabe: 5 × ${other} ist genau die Hälfte von 10 × ${other} (${other * 10} : 2 = ${c})!`;
  }
  if (a === 10 || b === 10) {
    const other = a === 10 ? b : a;
    return `🚀 Kernaufgabe: Mal 10 hängt einfach eine Null an (${other}0 = ${c})!`;
  }
  if (a === b) {
    return `⚡ Quadratzahl: ${a} × ${a} = ${c} (lässt sich wie ein Quadrat merken!)`;
  }

  // 9er Aufgaben: Fast die Zehn!
  if (a === 9 || b === 9) {
    const other = a === 9 ? b : a;
    return `💡 Trick (Fast die Zehn): Rechne erst 10 × ${other} = ${other * 10}, dann minus 1 × ${other} (${other * 10} − ${other} = ${c})!`;
  }
  // 6er Aufgaben: 5er-Nachbar!
  if (a === 6 || b === 6) {
    const other = a === 6 ? b : a;
    return `💡 Trick (5er-Nachbar): Rechne erst 5 × ${other} = ${5 * other}, plus 1 × ${other} (${5 * other} + ${other} = ${c})!`;
  }
  // 7er Aufgaben: Kernaufgaben 5 + 2!
  if (a === 7 || b === 7) {
    const other = a === 7 ? b : a;
    return `💡 Trick (5er + 2er Kernaufgabe): 5 × ${other} = ${5 * other} und 2 × ${other} = ${2 * other} zusammenzählen (${5 * other} + ${2 * other} = ${c})!`;
  }
  // 4er Aufgaben: Doppelt verdoppeln!
  if (a === 4 || b === 4) {
    const other = a === 4 ? b : a;
    return `💡 Trick (Doppelt verdoppeln): Erst 2 × ${other} = ${2 * other}, dann noch einmal verdoppeln (${2 * other} + ${2 * other} = ${c})!`;
  }
  // 8er Aufgaben: 10er minus 2er!
  if (a === 8 || b === 8) {
    const other = a === 8 ? b : a;
    return `💡 Trick: Rechne erst 10 × ${other} = ${other * 10}, minus 2 × ${other} (${other * 10} − ${2 * other} = ${c})!`;
  }
  // 3er Aufgaben: 2er + 1er!
  if (a === 3 || b === 3) {
    const other = a === 3 ? b : a;
    return `💡 Trick: Erst 2 × ${other} = ${2 * other}, plus 1 × ${other} (${2 * other} + ${other} = ${c})!`;
  }

  return `Tauschaufgabe: ${b} × ${a} = ${c}`;
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
    const multStrategy = getMultiplicationStrategyHint(a, b, c);
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
          hintText: multStrategy,
          strategyHint: multStrategy,
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
          strategyHint: `Umkehraufgabe: Welche Zahl mal ${b} ergibt ${c}? (${multStrategy})`,
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
          strategyHint: `Lücken-Strategie: ${a} × ${b} = ${c}. ${multStrategy}`,
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
          strategyHint: `Lücken-Strategie: ${a} × ${b} = ${c}. ${multStrategy}`,
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
