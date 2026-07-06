import React, { createContext, useContext, useReducer, type Dispatch } from 'react';

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

interface AppState {
  habits: Habit[];
  moods: MoodEntry[];
}

// ============================================================
// Helpers
// ============================================================

let _nextId = Date.now();
function genId(): string {
  return (_nextId++).toString(36);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// Actions
// ============================================================

type Action =
  | { type: 'ADD_HABIT'; name: string; emoji: string }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'TOGGLE_HABIT_DATE'; id: string; date: string }
  | { type: 'ADD_MOOD'; mood: string; note: string }
  | { type: 'DELETE_MOOD'; id: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
};

const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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

export { today };
