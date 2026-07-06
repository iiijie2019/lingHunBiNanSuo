import React, { createContext, useContext, useEffect, useReducer, useRef, type Dispatch } from 'react';

import { loadState, saveState } from '@/stores/storage';

// ============================================================
// Types
// ============================================================

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** ISO date strings of completed dates */
  completedDates: string[];
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  /** ISO date string */
  date: string;
  /** emoji representing the mood */
  mood: string;
  note: string;
}

/** Summary stats persisted per game */
export interface GameRecord {
  /** best / high score (meaning depends on game) */
  best: number;
  /** total games played */
  games: number;
  /** extra stat 1 (e.g. total score, average ms, accuracy %) */
  extra1: number;
  /** extra stat 2 */
  extra2: number;
  /** last played ISO date */
  lastPlayed: string | null;
}

export interface GameRecords {
  guessNumber: GameRecord;   // best = fewest attempts to win
  whackAMole: GameRecord;    // best = highest score
  reaction: GameRecord;      // best = fastest reaction (ms)
  colorWord: GameRecord;     // best = highest correct count; extra1 = best accuracy %
  mathChallenge: GameRecord; // best = highest correct count; extra1 = best accuracy %
}

export interface AppState {
  habits: Habit[];
  moods: MoodEntry[];
  gameRecords: GameRecords;
}

// ============================================================
// Default game records
// ============================================================

function defaultGameRecord(): GameRecord {
  return { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null };
}

function defaultGameRecords(): GameRecords {
  return {
    guessNumber: { ...defaultGameRecord(), best: 999 },
    whackAMole: defaultGameRecord(),
    reaction: { ...defaultGameRecord(), best: 9999 },
    colorWord: defaultGameRecord(),
    mathChallenge: defaultGameRecord(),
  };
}

// ============================================================
// Helpers
// ============================================================

let _nextId = Date.now();
function genId(): string {
  return (_nextId++).toString(36);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// Actions
// ============================================================

type Action =
  // Habits
  | { type: 'ADD_HABIT'; name: string; emoji: string }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'TOGGLE_HABIT_DATE'; id: string; date: string }
  // Moods
  | { type: 'ADD_MOOD'; mood: string; note: string }
  | { type: 'DELETE_MOOD'; id: string }
  // Game records
  | { type: 'SAVE_GAME_RECORD'; game: keyof GameRecords; score: number; extra1?: number; extra2?: number }
  // Hydration from storage
  | { type: 'HYDRATE'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ---- Habits ----
    case 'ADD_HABIT':
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            id: genId(),
            name: action.name,
            emoji: action.emoji,
            completedDates: [],
            createdAt: today(),
          },
        ],
      };

    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
      };

    case 'TOGGLE_HABIT_DATE': {
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const has = h.completedDates.includes(action.date);
          return {
            ...h,
            completedDates: has
              ? h.completedDates.filter((d) => d !== action.date)
              : [...h.completedDates, action.date].sort(),
          };
        }),
      };
    }

    // ---- Moods ----
    case 'ADD_MOOD':
      return {
        ...state,
        moods: [
          {
            id: genId(),
            date: today(),
            mood: action.mood,
            note: action.note,
          },
          ...state.moods,
        ],
      };

    case 'DELETE_MOOD':
      return {
        ...state,
        moods: state.moods.filter((m) => m.id !== action.id),
      };

    // ---- Game Records ----
    case 'SAVE_GAME_RECORD': {
      const prev = state.gameRecords[action.game];
      const isGuessNumber = action.game === 'guessNumber';
      const isReaction = action.game === 'reaction';

      // For guess-number and reaction, lower is better
      const best = isGuessNumber || isReaction
        ? Math.min(prev.best, action.score)
        : Math.max(prev.best, action.score);

      // extra1: for colorWord/mathChallenge → best accuracy; otherwise keep max
      const extra1 = action.extra1 !== undefined
        ? Math.max(prev.extra1, action.extra1)
        : prev.extra1;

      return {
        ...state,
        gameRecords: {
          ...state.gameRecords,
          [action.game]: {
            best,
            games: prev.games + 1,
            extra1,
            extra2: action.extra2 !== undefined ? action.extra2 : prev.extra2,
            lastPlayed: today(),
          },
        },
      };
    }

    // ---- Hydration ----
    case 'HYDRATE':
      return {
        ...action.state,
        // Ensure gameRecords exist for migrations from older stored state
        gameRecords: {
          ...defaultGameRecords(),
          ...action.state.gameRecords,
        },
      };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

const initialState: AppState = {
  habits: [],
  moods: [],
  gameRecords: defaultGameRecords(),
};

const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  // Load persisted state on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadState<AppState>();
      if (saved && !cancelled) {
        dispatch({ type: 'HYDRATE', state: saved });
      }
      hydrated.current = true;
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist state on every change (after initial hydration)
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip the first render — that's hydration, not a user change
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only persist after hydration is done
    if (!hydrated.current) return;
    saveState(state);
  }, [state]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useStore() {
  return useContext(StateContext);
}

export function useDispatch() {
  return useContext(DispatchContext);
}
