import React, { createContext, useContext, useEffect, useReducer, useState, type Dispatch } from 'react';

import { loadState, saveState } from '@/stores/storage';
import { isLocalDateKey, localDateKey } from '@/utils/local-date';

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

export interface DiaryEntry {
  id: string;
  /** ISO date string */
  date: string;
  /** ISO datetime string */
  createdAt: string;
  title: string;
  content: string;
  /** optional mood emoji to link with mood */
  moodEmoji?: string;
  /** optional tags */
  tags: string[];
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
  memoryCard: GameRecord;    // best = highest score (points per move)
  colorWord: GameRecord;     // best = highest correct count; extra1 = best accuracy %
  mathChallenge: GameRecord; // best = highest correct count; extra1 = best accuracy %
}

export interface EntryPreferences {
  hiddenGames: string[];
  hiddenTools: string[];
}

export interface AppState {
  habits: Habit[];
  moods: MoodEntry[];
  diary: DiaryEntry[];
  gameRecords: GameRecords;
  entryPreferences: EntryPreferences;
}

// ============================================================
// Default game records
// ============================================================

function defaultGameRecord(): GameRecord {
  return { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null };
}

export function defaultGameRecords(): GameRecords {
  return {
    guessNumber: { ...defaultGameRecord(), best: 999 },
    whackAMole: defaultGameRecord(),
    reaction: { ...defaultGameRecord(), best: 9999 },
    memoryCard: defaultGameRecord(),
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
  return localDateKey();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeGameRecord(value: unknown, fallback: GameRecord): GameRecord {
  if (!isRecord(value)) return fallback;
  const finiteOr = (candidate: unknown, defaultValue: number) =>
    typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : defaultValue;

  return {
    best: finiteOr(value.best, fallback.best),
    games: Math.max(0, Math.floor(finiteOr(value.games, fallback.games))),
    extra1: finiteOr(value.extra1, fallback.extra1),
    extra2: finiteOr(value.extra2, fallback.extra2),
    lastPlayed: isLocalDateKey(value.lastPlayed) ? value.lastPlayed : null,
  };
}

/** Validate and migrate persisted or imported data before it reaches the UI. */
export function normalizeAppState(value: unknown): AppState | null {
  if (!isRecord(value) || !Array.isArray(value.habits) || !Array.isArray(value.moods)) {
    return null;
  }

  const habits = value.habits.map((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' ||
        typeof item.emoji !== 'string' || !Array.isArray(item.completedDates)) return null;
    if (!item.completedDates.every(isLocalDateKey)) return null;
    return {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      completedDates: [...new Set(item.completedDates)].sort(),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : today(),
    } satisfies Habit;
  });
  if (habits.some((item) => item === null)) return null;

  const moods = value.moods.map((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isLocalDateKey(item.date) ||
        typeof item.mood !== 'string' || typeof item.note !== 'string') return null;
    return { id: item.id, date: item.date, mood: item.mood, note: item.note } satisfies MoodEntry;
  });
  if (moods.some((item) => item === null)) return null;

  const rawDiary = value.diary ?? [];
  if (!Array.isArray(rawDiary)) return null;
  const diary = rawDiary.map((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isLocalDateKey(item.date) ||
        typeof item.createdAt !== 'string' || Number.isNaN(Date.parse(item.createdAt)) || typeof item.title !== 'string' ||
        typeof item.content !== 'string') return null;
    const tags = Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === 'string')
      ? item.tags
      : [];
    return {
      id: item.id,
      date: item.date,
      createdAt: item.createdAt,
      title: item.title,
      content: item.content,
      moodEmoji: typeof item.moodEmoji === 'string' ? item.moodEmoji : undefined,
      tags,
    } satisfies DiaryEntry;
  });
  if (diary.some((item) => item === null)) return null;

  const defaults = defaultGameRecords();
  const rawRecords = isRecord(value.gameRecords) ? value.gameRecords : {};
  const gameRecords = Object.fromEntries(
    (Object.keys(defaults) as (keyof GameRecords)[]).map((key) => [
      key,
      normalizeGameRecord(rawRecords[key], defaults[key]),
    ]),
  ) as unknown as GameRecords;

  const rawPreferences = isRecord(value.entryPreferences) ? value.entryPreferences : {};
  const stringList = (candidate: unknown) => Array.isArray(candidate)
    ? [...new Set(candidate.filter((item): item is string => typeof item === 'string'))]
    : [];
  const entryPreferences: EntryPreferences = {
    hiddenGames: stringList(rawPreferences.hiddenGames),
    hiddenTools: stringList(rawPreferences.hiddenTools),
  };

  return {
    habits: habits as Habit[],
    moods: moods as MoodEntry[],
    diary: diary as DiaryEntry[],
    gameRecords,
    entryPreferences,
  };
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
  // Diary
  | { type: 'ADD_DIARY'; title: string; content: string; moodEmoji?: string; tags?: string[] }
  | { type: 'UPDATE_DIARY'; id: string; title: string; content: string; moodEmoji?: string; tags?: string[] }
  | { type: 'DELETE_DIARY'; id: string }
  // Game records
  | { type: 'SAVE_GAME_RECORD'; game: keyof GameRecords; score: number; extra1?: number; extra2?: number }
  // Entry visibility
  | { type: 'SET_HIDDEN_ENTRIES'; category: keyof EntryPreferences; entries: string[] }
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

    // ---- Diary ----
    case 'ADD_DIARY':
      return {
        ...state,
        diary: [
          {
            id: genId(),
            date: today(),
            createdAt: new Date().toISOString(),
            title: action.title,
            content: action.content,
            moodEmoji: action.moodEmoji,
            tags: action.tags ?? [],
          },
          ...state.diary,
        ],
      };

    case 'UPDATE_DIARY':
      return {
        ...state,
        diary: state.diary.map((d) =>
          d.id === action.id
            ? {
                ...d,
                title: action.title,
                content: action.content,
                moodEmoji: action.moodEmoji,
                tags: action.tags ?? d.tags,
              }
            : d,
        ),
      };

    case 'DELETE_DIARY':
      return {
        ...state,
        diary: state.diary.filter((d) => d.id !== action.id),
      };

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

    case 'SET_HIDDEN_ENTRIES':
      return {
        ...state,
        entryPreferences: {
          ...state.entryPreferences,
          [action.category]: [...new Set(action.entries)],
        },
      };

    // ---- Hydration ----
    case 'HYDRATE':
      return {
        ...action.state,
        // Normalized state already supplies defaults for data added by later versions.
        diary: action.state.diary ?? [],
        gameRecords: {
          ...defaultGameRecords(),
          ...action.state.gameRecords,
        },
        entryPreferences: action.state.entryPreferences,
      };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

export function createInitialState(): AppState {
  return {
    habits: [],
    moods: [],
    diary: [],
    gameRecords: defaultGameRecords(),
    entryPreferences: { hiddenGames: [], hiddenTools: [] },
  };
}

const initialState = createInitialState();

const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = normalizeAppState(await loadState<unknown>());
      if (!cancelled) {
        if (saved) dispatch({ type: 'HYDRATE', state: saved });
        setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounce persistence so rapid game and typing updates cannot race each other.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => { void saveState(state); }, 120);
    return () => clearTimeout(timer);
  }, [state, hydrated]);

  if (!hydrated) return null;

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
