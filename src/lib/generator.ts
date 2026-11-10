import type { EquationParts, TaskCard, TaskType } from './types';

export const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Erzeugt programmatisch den gesamten Aufgabenpool für das kleine 1×1 (Faktoren 1 bis 10).
 * Für jede Kombination (a, b) mit c = a * b werden 6 Aufgabentypen generiert (insgesamt 600 Karten):
 * - Standard-Multiplikation: a × b = ?
 * - Umkehraufgabe / Division: c : b = ?
 * - Lückenaufgabe Multiplikation: ? × b = c und a × ? = c
 * - Lückenaufgabe Division: ? : b = a und c : ? = b
 */
export function generateAllTaskCards(): TaskCard[] {
  const cards: TaskCard[] = [];

  for (let b = 1; b <= 10; b++) {
    for (let a = 1; a <= 10; a++) {
      const c = a * b;
      const fact: [number, number, number] = [a, b, c];
      const row = b;

      const definitions: Array<{
        type: TaskType;
        prompt: string;
        solution: number;
      }> = [
        { type: 'mult', prompt: `${a} × ${b} = ?`, solution: c },
        { type: 'div', prompt: `${c} : ${b} = ?`, solution: a },
        { type: 'gap_mult_a', prompt: `? × ${b} = ${c}`, solution: a },
        { type: 'gap_mult_b', prompt: `${a} × ? = ${c}`, solution: b },
        { type: 'gap_div_c', prompt: `? : ${b} = ${a}`, solution: c },
        { type: 'gap_div_a', prompt: `${c} : ? = ${b}`, solution: a },
      ];

      for (const def of definitions) {
        cards.push({
          id: `${def.type}_${a}_${b}`,
          prompt: def.prompt,
          fact,
          row,
          type: def.type,
          solution: def.solution,
          repetitions: 0,
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: 0,
          dueDate: 0,
          totalAttempts: 0,
          correctAttempts: 0,
        });
      }
    }
  }

  return cards;
}

/**
 * Erzeugt programmatisch den gesamten Aufgabenpool für den Modus "Zahlenheld"
 * (basales Einspluseins, Summanden 1 bis 10, Zahlenraum bis 20).
 * Für jede Kombination (a, b) mit c = a + b werden 6 Aufgabentypen erzeugt (insgesamt 600 Karten):
 * - Standard-Addition: a + b = ?
 * - Umkehraufgabe / Subtraktion: c - b = ?
 * - Lückenaufgaben Addition: a + ? = c und ? + b = c
 * - Lückenaufgaben Subtraktion: c - ? = a und ? - b = a
 */
export function generatePlusMinusCards(): TaskCard[] {
  const cards: TaskCard[] = [];

  for (let b = 1; b <= 10; b++) {
    for (let a = 1; a <= 10; a++) {
      const c = a + b;
      const fact: [number, number, number] = [a, b, c];
      const row = b;

      const definitions: Array<{
        type: TaskType;
        prompt: string;
        solution: number;
      }> = [
        { type: 'add', prompt: `${a} + ${b} = ?`, solution: c },
        { type: 'sub', prompt: `${c} - ${b} = ?`, solution: a },
        { type: 'gap_add_b', prompt: `${a} + ? = ${c}`, solution: b },
        { type: 'gap_add_a', prompt: `? + ${b} = ${c}`, solution: a },
        { type: 'gap_sub_b', prompt: `${c} - ? = ${a}`, solution: b },
        { type: 'gap_sub_c', prompt: `? - ${b} = ${a}`, solution: c },
      ];

      for (const def of definitions) {
        cards.push({
          id: `pm_${def.type}_${a}_${b}`,
          prompt: def.prompt,
          fact,
          row,
          type: def.type,
          solution: def.solution,
          repetitions: 0,
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: 0,
          dueDate: 0,
          totalAttempts: 0,
          correctAttempts: 0,
        });
      }
    }
  }

  return cards;
}

function getAdditionHint(a: number, b: number, c: number): string {
  if (a === b) {
    return `Verdopplungsaufgabe: ${a} + ${a} = ${c}`;
  }
  if (c === 10) {
    return `Verliebte Zahlen (Zehnerfreunde): ${a} + ${b} = 10`;
  }
  if (c > 10 && a < 10 && b < 10) {
    const toTen = 10 - a;
    const rest = b - toTen;
    return `Zehnerstopp: Erst ${a} + ${toTen} = 10, dann 10 + ${rest} = ${c}`;
  }
  return `Tauschaufgabe: ${b} + ${a} = ${c}`;
}

/**
 * Liefert die Darstellungsteile einer Aufgabe für die UI, sodass das Eingabefeld
 * exakt an der Position des gesuchten Wertes (?) erscheint.
 */
export function formatEquationParts(card: TaskCard): EquationParts {
  const [a, b, c] = card.fact;

  switch (card.type) {
    // --- 1×1 Meister (Multiplikation & Division) ---
    case 'mult':
      return {
        left: `${a} × ${b} =`,
        right: '',
        typeBadge: `${b}er-Reihe · Malnehmen`,
        fullEquationWithSolution: `${a} × ${b} = ${c}`,
        hintText:
          a !== b
            ? `Tauschaufgabe: ${b} × ${a} = ${c}`
            : `Quadratzahl: ${a} × ${a} = ${c}`,
      };
    case 'div':
      return {
        left: `${c} : ${b} =`,
        right: '',
        typeBadge: `${b}er-Reihe · Umkehraufgabe`,
        fullEquationWithSolution: `${c} : ${b} = ${a}`,
        hintText: `Umkehraufgabe: Denn ${a} × ${b} = ${c}`,
      };
    case 'gap_mult_a':
      return {
        left: '',
        right: `× ${b} = ${c}`,
        typeBadge: `${b}er-Reihe · Lückenaufgabe`,
        fullEquationWithSolution: `${a} × ${b} = ${c}`,
        hintText: `Überlege: Wie oft passt die ${b} in ${c}? (${c} : ${b} = ${a})`,
      };
    case 'gap_mult_b':
      return {
        left: `${a} ×`,
        right: `= ${c}`,
        typeBadge: `${b}er-Reihe · Lückenaufgabe`,
        fullEquationWithSolution: `${a} × ${b} = ${c}`,
        hintText: `Überlege: ${a} mal wie viel ergibt ${c}? (${a} × ${b} = ${c})`,
      };
    case 'gap_div_c':
      return {
        left: '',
        right: `: ${b} = ${a}`,
        typeBadge: `${b}er-Reihe · Geteilt-Lücke`,
        fullEquationWithSolution: `${c} : ${b} = ${a}`,
        hintText: `Umkehrtrick: Rechne einfach ${a} × ${b} = ${c}`,
      };
    case 'gap_div_a':
      return {
        left: `${c} :`,
        right: `= ${b}`,
        typeBadge: `${b}er-Reihe · Geteilt-Lücke`,
        fullEquationWithSolution: `${c} : ${a} = ${b}`,
        hintText: `Umkehrtrick: Denn ${a} × ${b} = ${c}`,
      };

    // --- Zahlenheld (Addition & Subtraktion bis 20) ---
    case 'add':
      return {
        left: `${a} + ${b} =`,
        right: '',
        typeBadge:
          c <= 10
            ? `Plus bis 10 · +${b}`
            : `Zehnerübergang · +${b}`,
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: getAdditionHint(a, b, c),
      };
    case 'sub':
      return {
        left: `${c} − ${b} =`,
        right: '',
        typeBadge:
          c > 10 && a < 10
            ? `Minus über die 10 · −${b}`
            : `Minus-Umkehraufgabe · −${b}`,
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText: `Umkehraufgabe: Denn ${a} + ${b} = ${c}`,
      };
    case 'gap_add_b':
      return {
        left: `${a} +`,
        right: `= ${c}`,
        typeBadge: c === 10 ? `Zehnerfreunde · Lücke` : `Plus-Lücke · bis ${c}`,
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: `Ergänzen: Von ${a} bis ${c} fehlen ${b} (${c} − ${a} = ${b})`,
      };
    case 'gap_add_a':
      return {
        left: '',
        right: `+ ${b} = ${c}`,
        typeBadge: c === 10 ? `Zehnerfreunde · Lücke` : `Plus-Lücke · +${b}`,
        fullEquationWithSolution: `${a} + ${b} = ${c}`,
        hintText: `Umkehrtrick: Rechne ${c} − ${b} = ${a}`,
      };
    case 'gap_sub_b':
      return {
        left: `${c} −`,
        right: `= ${a}`,
        typeBadge: `Minus-Lücke`,
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText: `Überlege: Von ${c} bis ${a} ist der Unterschied ${b} (${a} + ${b} = ${c})`,
      };
    case 'gap_sub_c':
      return {
        left: '',
        right: `− ${b} = ${a}`,
        typeBadge: `Minus-Lücke`,
        fullEquationWithSolution: `${c} − ${b} = ${a}`,
        hintText: `Umkehrtrick: Rechne einfach ${a} + ${b} = ${c}`,
      };
  }
}
