import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const ROWS = 12;
const COLS = 12;

type Cell = { top: boolean; bottom: boolean; left: boolean; right: boolean; visited: boolean };

function generateMaze(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ top: true, bottom: true, left: true, right: true, visited: false }))
  );
  const stack: [number, number][] = [];
  const start: [number, number] = [0, 0];
  grid[0][0].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, keyof Cell, keyof Cell][] = [];
    if (r > 0 && !grid[r - 1][c].visited) neighbors.push([r - 1, c, 'top', 'bottom']);
    if (r < ROWS - 1 && !grid[r + 1][c].visited) neighbors.push([r + 1, c, 'bottom', 'top']);
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push([r, c - 1, 'left', 'right']);
    if (c < COLS - 1 && !grid[r][c + 1].visited) neighbors.push([r, c + 1, 'right', 'left']);

    if (neighbors.length === 0) { stack.pop(); continue; }
    const [nr, nc, wall, opposite] = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[r][c][wall] = false;
    grid[nr][nc][opposite] = false;
    grid[nr][nc].visited = true;
    stack.push([nr, nc]);
  }
  // Open start and end
  grid[0][0].top = false;
  grid[ROWS - 1][COLS - 1].bottom = false;
  return grid;
}

export default function MazeScreen() {
  const isDark = useColorScheme() === 'dark';
  const [maze, setMaze] = useState<Cell[][]>(() => generateMaze());
  const [path, setPath] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [won, setWon] = useState(false);
  const [steps, setSteps] = useState(0);

  const newGame = () => {
    const m = generateMaze();
    setMaze(m);
    setPath(new Set(['0,0']));
    setPos([0, 0]);
    setWon(false);
    setSteps(0);
  };

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    const [r, c] = pos;
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    // Check wall
    if (dr === -1 && maze[r][c].top) return;
    if (dr === 1 && maze[r][c].bottom) return;
    if (dc === -1 && maze[r][c].left) return;
    if (dc === 1 && maze[r][c].right) return;
    setPos([nr, nc]);
    setSteps((s) => s + 1);
    setPath((p) => new Set([...p, `${nr},${nc}`]));
    if (nr === ROWS - 1 && nc === COLS - 1) setWon(true);
  }, [pos, maze, won]);

  const cellSize = Math.floor((Math.min(500, 380) - 32) / COLS);
  const boardSize = cellSize * COLS;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}><FontAwesome name="angle-left" size={18} color="#34C759" /></ThemedView>
            <ThemedText type="small" style={{ color: '#34C759' }}>返回</ThemedText>
          </Pressable>

          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">走迷宫</ThemedText>
            <ThemedView style={styles.stepBadge}>
              <ThemedText type="smallBold" style={{ color: '#34C759' }}>{steps} 步</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Maze */}
          <ThemedView type="backgroundElement" style={[styles.mazeWrap, { width: boardSize + 24, height: boardSize + 24 }]}>
            <ThemedView style={{
              width: boardSize + 4, height: boardSize + 4,
              borderWidth: 3, borderColor: isDark ? '#888' : '#444',
              borderRadius: 4, alignItems: 'center', justifyContent: 'center',
            }}>
              <ThemedView style={{ width: boardSize, height: boardSize, position: 'relative' }}>
                {maze.map((row, r) =>
                  row.map((cell, c) => (
                    <ThemedView key={`${r}-${c}`} style={{
                      position: 'absolute', left: c * cellSize, top: r * cellSize,
                      width: cellSize, height: cellSize,
                      backgroundColor: path.has(`${r},${c}`) ? '#34C75920' : 'transparent',
                      borderTopWidth: cell.top ? 1.5 : 0, borderTopColor: isDark ? '#666' : '#333',
                      borderBottomWidth: cell.bottom ? 1.5 : 0, borderBottomColor: isDark ? '#666' : '#333',
                      borderLeftWidth: cell.left ? 1.5 : 0, borderLeftColor: isDark ? '#666' : '#333',
                      borderRightWidth: cell.right ? 1.5 : 0, borderRightColor: isDark ? '#666' : '#333',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {r === 0 && c === 0 && (
                        <FontAwesome name="home" size={cellSize * 0.55} color="#208AEF" />
                      )}
                      {r === ROWS - 1 && c === COLS - 1 && (
                        <FontAwesome name="flag" size={cellSize * 0.55} color="#FF6B6B" />
                      )}
                      {r === pos[0] && c === pos[1] && !(r === 0 && c === 0) && !(r === ROWS - 1 && c === COLS - 1) && (
                        <FontAwesome name="user" size={cellSize * 0.55} color="#208AEF" />
                      )}
                    </ThemedView>
                  ))
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* D-pad controls below maze */}
          <ThemedView style={styles.controlRow}>
            <Pressable style={styles.dirBtn} onPress={() => move(-1, 0)}><FontAwesome name="arrow-up" size={24} color="#34C759" /></Pressable>
            <ThemedView style={styles.horzControls}>
              <Pressable style={styles.dirBtn} onPress={() => move(0, -1)}><FontAwesome name="arrow-left" size={24} color="#34C759" /></Pressable>
              <ThemedView style={styles.centerGap} />
              <Pressable style={styles.dirBtn} onPress={() => move(0, 1)}><FontAwesome name="arrow-right" size={24} color="#34C759" /></Pressable>
            </ThemedView>
            <Pressable style={styles.dirBtn} onPress={() => move(1, 0)}><FontAwesome name="arrow-down" size={24} color="#34C759" /></Pressable>
          </ThemedView>

          {won && (
            <ThemedView style={styles.winCard}>
              <ThemedText style={styles.winEmoji}>🎉</ThemedText>
              <ThemedText style={styles.winText}>走出迷宫！用了 {steps} 步</ThemedText>
              <Pressable style={styles.resetBtn} onPress={newGame}>
                <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>再来一局</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: 14 },
  scroll: { paddingBottom: Spacing.six, alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start', width: '100%' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#34C75912', alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  stepBadge: { backgroundColor: '#34C75912', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 16 },

  controlRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.four , padding: 20},
  horzControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  centerGap: { width: 20, height: 56 },
  dirBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#34C75915', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#34C75940' },

  mazeWrap: { padding: Spacing.two, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  winCard: { marginTop: Spacing.four, alignItems: 'center', gap: Spacing.two },
  winEmoji: { fontSize: 48 },
  winText: { fontSize: 18, fontWeight: '600', color: '#34C759' },
  resetBtn: { backgroundColor: '#34C759', paddingVertical: Spacing.two, paddingHorizontal: Spacing.five, borderRadius: Spacing.three, marginTop: Spacing.one },
});
