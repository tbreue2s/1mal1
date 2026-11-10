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

      const definitions: Array<{ type: TaskType; solution: number }> = [
        { type: 'mult', solution: c },       // a × b = ?
        { type: 'div', solution: a },        // c : b = ?
        { type: 'gap_mult_a', solution: a }, // ? × b = c
        { type: 'gap_mult_b', solution: b }, // a × ? = c
        { type: 'gap_div_c', solution: c },  // ? : b = a
        { type: 'gap_div_a', solution: a },  // c : ? = b
      ];

      for (const def of definitions) {
        cards.push({
          id: `${def.type}_${a}_${b}`,
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
 * Liefert die Darstellungsteile einer Aufgabe für die UI, sodass das Eingabefeld
 * exakt an der Position des gesuchten Wertes (?) erscheint.
 */
export function formatEquationParts(card: TaskCard): EquationParts {
  const [a, b, c] = card.fact;

  switch (card.type) {
    case 'mult':
      return {
        left: `${a} × ${b} =`,
        right: '',
        typeBadge: `${b}er-Reihe · Malnehmen`,
        fullEquationWithSolution: `${a} × ${b} = ${c}`,
        hintText: a !== b ? `Tauschaufgabe: ${b} × ${a} = ${c}` : `Quadratzahl: ${a} × ${a} = ${c}`,
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
  }
}

