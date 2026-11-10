export type TaskType =
  | 'mult'        // a × b = ?
  | 'div'         // c : b = ?
  | 'gap_mult_a'  // ? × b = c
  | 'gap_mult_b'  // a × ? = c
  | 'gap_div_c'   // ? : b = a
  | 'gap_div_a';  // c : ? = b

export interface TaskCard {
  id: string;
  fact: [number, number, number]; // [a, b, c] mit c = a * b
  row: number;                    // 1 bis 10 (Reihe)
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

export type MasteryStatus = 'new' | 'learning' | 'mastered';

export type LogoVariantId = 'blocks' | 'owl' | 'rocket' | 'trophy' | 'fox';

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
  sessionSize: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  stats: UserStats;
  cards: TaskCard[];
}

export interface EquationParts {
  left: string;
  right: string;
  typeBadge: string;
  fullEquationWithSolution: string;
  hintText: string;
}
