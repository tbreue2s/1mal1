export type GameMode = 'mult' | 'plusminus';

export type TaskType =
  // 1×1 Meister (Multiplikation & Division)
  | 'mult'        // a × b = ?
  | 'div'         // c : b = ?
  | 'gap_mult_a'  // ? × b = c
  | 'gap_mult_b'  // a × ? = c
  | 'gap_div_c'   // ? : b = a
  | 'gap_div_a'   // c : ? = b
  // Zahlenheld (Addition & Subtraktion bis 20)
  | 'add'         // a + b = ?
  | 'sub'         // c - b = ?
  | 'gap_add_b'   // a + ? = c
  | 'gap_add_a'   // ? + b = c
  | 'gap_sub_b'   // c - ? = a
  | 'gap_sub_c';  // ? - b = a

export interface TaskCard {
  id: string;
  prompt: string;                 // Lesbare Aufgabenstellung, z. B. "3 × 4 = ?" oder "7 + 5 = ?"
  fact: [number, number, number]; // [a, b, c] mit c = a * b (1×1) bzw. c = a + b (Zahlenheld)
  row: number;                    // 1 bis 10 (Reihe / Summand b)
  type: TaskType;
  solution: number;
  // Spaced Repetition (SM-2)
  repetitions: number;
  easeFactor: number;
  interval: number;               // in Tagen
  dueDate: number;                // Zeitstempel (ms)
  // Zusatz-Statistiken für Didaktik & Matrix
  lastQuality?: 0 | 2 | 3 | 4;
  lastResponseMs?: number;
  totalAttempts: number;
  correctAttempts: number;
}

export type LearningMode = 'daily' | 'rows';

export type TypeFilter = 'mult_only' | 'all_types';

export type PlusMinusFocus = 'up_to_10' | 'over_10' | 'doubles' | 'rows';

export type MasteryStatus = 'new' | 'learning' | 'mastered';

export type LogoVariantId = 'penguin' | 'otter' | 'owl' | 'rocket' | 'fox';

export interface UserStats {
  stars: number;
  streakDays: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
  totalSolved: number;
  fastSolved: number;
  soundEnabled: boolean;
  selectedRows: number[];
  learningMode: LearningMode;
  typeFilter: TypeFilter;
  plusMinusFocus?: PlusMinusFocus;
  sessionSize: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  logoVariant?: LogoVariantId;
  activeGameMode?: GameMode;
  createdAt: number;
  // 1×1 Meister State (bestehende Struktur für 100% Rückwärtskompatibilität)
  stats: UserStats;
  cards: TaskCard[];
  // Zahlenheld (Plus & Minus bis 20) State – komplett isoliert je Nutzer
  plusMinusStats: UserStats;
  plusMinusCards: TaskCard[];
}

export interface EquationParts {
  left: string;
  right: string;
  typeBadge: string;
  fullEquationWithSolution: string;
  hintText: string;
}
