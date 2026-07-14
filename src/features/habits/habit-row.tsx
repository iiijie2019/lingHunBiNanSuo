import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { today, useDispatch, type Habit } from '@/stores/useStore';
import { shiftLocalDateKey } from '@/utils/local-date';

export function HabitRow({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  const dispatch = useDispatch();
  const todaysDate = today();
  const isDone = habit.completedDates.includes(todaysDate);

  let streak = 0;
  const dates = new Set(habit.completedDates);
  let dateKey = dates.has(todaysDate) ? todaysDate : shiftLocalDateKey(todaysDate, -1);
  while (dates.has(dateKey)) {
    streak++;
    dateKey = shiftLocalDateKey(dateKey, -1);
  }

  const toggle = () => {
    dispatch({ type: 'TOGGLE_HABIT_DATE', id: habit.id, date: todaysDate });
  };

  return (
    <Pressable onLongPress={onDelete} style={styles.pressable}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.checkbox,
            isDone && styles.checkboxDone,
            pressed && styles.checkboxPressed,
          ]}
          onPress={toggle}
        >
          {isDone && <FontAwesome name="check" size={14} color="#FFFFFF" />}
        </Pressable>

        <ThemedView style={styles.info}>
          <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
          <ThemedView style={styles.textGroup}>
            <ThemedText type="default">{habit.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              🔥 {streak} 天连续
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <WeekDots dates={habit.completedDates} />
      </ThemedView>
    </Pressable>
  );
}

function WeekDots({ dates }: { dates: string[] }) {
  const dateSet = new Set(dates);
  const dots: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    dots.push(dateSet.has(shiftLocalDateKey(today(), -i)));
  }

  return (
    <ThemedView style={styles.weekDots}>
      {dots.map((done, i) => (
        <ThemedView
          key={i}
          type={done ? undefined : 'backgroundSelected'}
          style={[styles.dot, done && styles.dotDone]}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: Spacing.three },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.three, borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#C0C0C0',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkboxPressed: { opacity: 0.6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  emoji: { fontSize: 22, lineHeight: 28 },
  textGroup: { gap: 1 },
  weekDots: { flexDirection: 'row', gap: 4, paddingRight: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: '#34C759' },
});
