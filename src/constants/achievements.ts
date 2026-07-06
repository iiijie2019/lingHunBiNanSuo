import type { AppState } from '@/stores/useStore';

// ============================================================
// Achievement Definitions
// ============================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'habits' | 'mood' | 'diary' | 'games' | 'general';
  /** Check if this achievement is unlocked given current state */
  check: (state: AppState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ---- 习惯打卡 ----
  {
    id: 'habits_first',
    title: '迈出第一步',
    description: '创建第一个习惯',
    emoji: '🌱',
    category: 'habits',
    check: (s) => s.habits.length >= 1,
  },
  {
    id: 'habits_3',
    title: '好习惯养成中',
    description: '同时维护 3 个习惯',
    emoji: '📋',
    category: 'habits',
    check: (s) => s.habits.length >= 3,
  },
  {
    id: 'habits_7',
    title: '自律达人',
    description: '同时维护 7 个习惯',
    emoji: '🏅',
    category: 'habits',
    check: (s) => s.habits.length >= 7,
  },
  {
    id: 'streak_7',
    title: '一周坚持',
    description: '连续打卡 7 天',
    emoji: '🔥',
    category: 'habits',
    check: (s) => maxStreak(s) >= 7,
  },
  {
    id: 'streak_30',
    title: '月度冠军',
    description: '连续打卡 30 天',
    emoji: '💪',
    category: 'habits',
    check: (s) => maxStreak(s) >= 30,
  },
  {
    id: 'streak_100',
    title: '百日修行',
    description: '连续打卡 100 天',
    emoji: '👑',
    category: 'habits',
    check: (s) => maxStreak(s) >= 100,
  },
  {
    id: 'habits_100_total',
    title: '百次打卡',
    description: '累计完成 100 次打卡',
    emoji: '✅',
    category: 'habits',
    check: (s) => totalCompletions(s) >= 100,
  },

  // ---- 心情记录 ----
  {
    id: 'mood_first',
    title: '初次表达',
    description: '记录第一条心情',
    emoji: '💬',
    category: 'mood',
    check: (s) => s.moods.length >= 1,
  },
  {
    id: 'mood_7',
    title: '情绪观察者',
    description: '累计记录 7 天心情',
    emoji: '🎭',
    category: 'mood',
    check: (s) => s.moods.length >= 7,
  },
  {
    id: 'mood_30',
    title: '情绪日记',
    description: '累计记录 30 天心情',
    emoji: '📖',
    category: 'mood',
    check: (s) => s.moods.length >= 30,
  },
  {
    id: 'mood_full_week',
    title: '完整一周',
    description: '连续 7 天记录心情（不中断）',
    emoji: '🌈',
    category: 'mood',
    check: (s) => moodStreak(s) >= 7,
  },

  // ---- 日记 ----
  {
    id: 'diary_first',
    title: '第一篇日记',
    description: '写下一篇日记',
    emoji: '✍️',
    category: 'diary',
    check: (s) => (s.diary ?? []).length >= 1,
  },
  {
    id: 'diary_10',
    title: '笔耕不辍',
    description: '累计写 10 篇日记',
    emoji: '📝',
    category: 'diary',
    check: (s) => (s.diary ?? []).length >= 10,
  },
  {
    id: 'diary_30',
    title: '日记达人',
    description: '累计写 30 篇日记',
    emoji: '📚',
    category: 'diary',
    check: (s) => (s.diary ?? []).length >= 30,
  },

  // ---- 小游戏 ----
  {
    id: 'game_guess_5',
    title: '神算子',
    description: '猜数字 5 次以内猜中',
    emoji: '🎯',
    category: 'games',
    check: (s) => s.gameRecords.guessNumber.best <= 5 && s.gameRecords.guessNumber.games > 0,
  },
  {
    id: 'game_whack_50',
    title: '打地鼠高手',
    description: '打地鼠单局得分 ≥ 50',
    emoji: '🐹',
    category: 'games',
    check: (s) => s.gameRecords.whackAMole.best >= 50,
  },
  {
    id: 'game_reaction_200',
    title: '闪电反应',
    description: '反应速度 ≤ 200ms',
    emoji: '⚡',
    category: 'games',
    check: (s) => s.gameRecords.reaction.best <= 200 && s.gameRecords.reaction.games > 0,
  },
  {
    id: 'game_math_20',
    title: '数学天才',
    description: '数学速算单局答对 ≥ 20 题',
    emoji: '🧮',
    category: 'games',
    check: (s) => s.gameRecords.mathChallenge.best >= 20,
  },
  {
    id: 'game_all_played',
    title: '游戏全能',
    description: '玩过所有 5 个小游戏',
    emoji: '🎮',
    category: 'games',
    check: (s) => {
      const all = ['guessNumber', 'whackAMole', 'reaction', 'colorWord', 'mathChallenge'] as const;
      return all.every((k) => s.gameRecords[k].games > 0);
    },
  },
];

// ============================================================
// Checker helpers
// ============================================================

function maxStreak(state: AppState): number {
  const allDates = new Set<string>();
  state.habits.forEach((h) => h.completedDates.forEach((d) => allDates.add(d)));
  const sorted = [...allDates].sort().reverse();
  let best = 0;
  let current = 0;
  let prev: Date | null = null;
  for (const ds of sorted) {
    const d = new Date(ds);
    if (prev) {
      const diff = (prev.getTime() - d.getTime()) / 86400000;
      if (diff === 1) {
        current++;
      } else {
        best = Math.max(best, current);
        current = 1;
      }
    } else {
      current = 1;
    }
    prev = d;
  }
  return Math.max(best, current);
}

function totalCompletions(state: AppState): number {
  return state.habits.reduce((sum, h) => sum + h.completedDates.length, 0);
}

function moodStreak(state: AppState): number {
  const dates = [...new Set(state.moods.map((m) => m.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

// ============================================================
// Get unlocked achievements
// ============================================================

export function getUnlocked(state: AppState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(state));
}

export function getCategoryUnlocked(
  state: AppState,
  category: Achievement['category'],
): Achievement[] {
  return getUnlocked(state).filter((a) => a.category === category);
}

export const CATEGORY_CONFIG: Record<Achievement['category'], { label: string; emoji: string }> = {
  habits: { label: '习惯', emoji: '✅' },
  mood: { label: '心情', emoji: '💖' },
  diary: { label: '日记', emoji: '📝' },
  games: { label: '游戏', emoji: '🎮' },
  general: { label: '综合', emoji: '🏆' },
};
