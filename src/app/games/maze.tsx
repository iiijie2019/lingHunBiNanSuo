import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Cell = { top: boolean; bottom: boolean; left: boolean; right: boolean };
type Position = [number, number];
type Phase = 'setup' | 'playing' | 'won';
type DifficultyKey = 'scout' | 'voyager' | 'deepSpace';
type Direction = 'up' | 'down' | 'left' | 'right';

type MazeSettings = {
  difficulty: DifficultyKey;
  showTrail: boolean;
};

const DIFFICULTIES: Record<DifficultyKey, { label: string; size: number; description: string }> = {
  scout: { label: '巡航', size: 8, description: '8 × 8，适合快速探索' },
  voyager: { label: '远航', size: 12, description: '12 × 12，路线更加曲折' },
  deepSpace: { label: '深空', size: 16, description: '16 × 16，挑战复杂星域' },
};

const DEFAULT_SETTINGS: MazeSettings = { difficulty: 'voyager', showTrail: true };
const DIRECTIONS: Record<Direction, { dr: number; dc: number; wall: keyof Cell; icon: React.ComponentProps<typeof FontAwesome>['name']; label: string }> = {
  up: { dr: -1, dc: 0, wall: 'top', icon: 'arrow-up', label: '向上移动' },
  down: { dr: 1, dc: 0, wall: 'bottom', icon: 'arrow-down', label: '向下移动' },
  left: { dr: 0, dc: -1, wall: 'left', icon: 'arrow-left', label: '向左移动' },
  right: { dr: 0, dc: 1, wall: 'right', icon: 'arrow-right', label: '向右移动' },
};

function keyOf([row, col]: Position): string {
  return `${row},${col}`;
}

function generateMaze(size: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ top: true, bottom: true, left: true, right: true })),
  );
  const visited = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const stack: Position[] = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1];
    const neighbors: [number, number, keyof Cell, keyof Cell][] = [];
    if (row > 0 && !visited[row - 1][col]) neighbors.push([row - 1, col, 'top', 'bottom']);
    if (row < size - 1 && !visited[row + 1][col]) neighbors.push([row + 1, col, 'bottom', 'top']);
    if (col > 0 && !visited[row][col - 1]) neighbors.push([row, col - 1, 'left', 'right']);
    if (col < size - 1 && !visited[row][col + 1]) neighbors.push([row, col + 1, 'right', 'left']);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }
    const [nextRow, nextCol, wall, opposite] = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[row][col][wall] = false;
    grid[nextRow][nextCol][opposite] = false;
    visited[nextRow][nextCol] = true;
    stack.push([nextRow, nextCol]);
  }

  grid[0][0].top = false;
  grid[size - 1][size - 1].bottom = false;
  return grid;
}

function availableNeighbors(maze: Cell[][], [row, col]: Position): Position[] {
  const size = maze.length;
  const cell = maze[row][col];
  const result: Position[] = [];
  if (!cell.top && row > 0) result.push([row - 1, col]);
  if (!cell.bottom && row < size - 1) result.push([row + 1, col]);
  if (!cell.left && col > 0) result.push([row, col - 1]);
  if (!cell.right && col < size - 1) result.push([row, col + 1]);
  return result;
}

function findPath(maze: Cell[][], start: Position, end: Position): Position[] {
  const queue: Position[] = [start];
  const startKey = keyOf(start);
  const endKey = keyOf(end);
  const parent = new Map<string, string | null>([[startKey, null]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const currentKey = keyOf(current);
    if (currentKey === endKey) break;
    for (const neighbor of availableNeighbors(maze, current)) {
      const neighborKey = keyOf(neighbor);
      if (parent.has(neighborKey)) continue;
      parent.set(neighborKey, currentKey);
      queue.push(neighbor);
    }
  }

  if (!parent.has(endKey)) return [];
  const route: Position[] = [];
  let cursor: string | null = endKey;
  while (cursor) {
    const [row, col] = cursor.split(',').map(Number);
    route.push([row, col]);
    cursor = parent.get(cursor) ?? null;
  }
  return route.reverse();
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function MazeScreen() {
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('setup');
  const [settings, setSettings] = useState<MazeSettings>(DEFAULT_SETTINGS);
  const [roundSettings, setRoundSettings] = useState<MazeSettings>(DEFAULT_SETTINGS);
  const [maze, setMaze] = useState<Cell[][]>(() => generateMaze(DIFFICULTIES.voyager.size));
  const [position, setPosition] = useState<Position>([0, 0]);
  const [trail, setTrail] = useState<string[]>(['0,0']);
  const [steps, setSteps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintCell, setHintCell] = useState<string | null>(null);

  const phaseRef = useRef<Phase>('setup');
  const positionRef = useRef<Position>([0, 0]);
  const stepsRef = useRef(0);
  const startedAtRef = useRef(0);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const size = maze.length;
  const exit = useMemo<Position>(() => [size - 1, size - 1], [size]);
  const optimalPath = useMemo(() => findPath(maze, [0, 0], exit), [maze, exit]);
  const routeToExit = useMemo(() => findPath(maze, position, exit), [maze, position, exit]);
  const trailSet = useMemo(() => new Set(trail), [trail]);
  const optimalSteps = Math.max(0, optimalPath.length - 1);
  const remainingSteps = Math.max(0, routeToExit.length - 1);
  const efficiency = steps > 0 ? Math.min(100, Math.round((optimalSteps / steps) * 100)) : 100;
  const boardSize = Math.floor(Math.min(windowWidth - Spacing.four * 2, Math.max(224, windowHeight - 360), 400));
  const cellSize = boardSize / size;

  const clearTimers = useCallback(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (hintRef.current) clearTimeout(hintRef.current);
    clockRef.current = null;
    hintRef.current = null;
  }, []);

  const resetRound = useCallback((nextMaze: Cell[][], nextSettings: MazeSettings) => {
    clearTimers();
    phaseRef.current = 'playing';
    positionRef.current = [0, 0];
    stepsRef.current = 0;
    startedAtRef.current = Date.now();
    setMaze(nextMaze);
    setRoundSettings(nextSettings);
    setPosition([0, 0]);
    setTrail(['0,0']);
    setSteps(0);
    setElapsed(0);
    setHintsUsed(0);
    setHintCell(null);
    setPhase('playing');
    clockRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
  }, [clearTimers]);

  const startNewMaze = useCallback(() => {
    const lockedSettings = { ...settings };
    resetRound(generateMaze(DIFFICULTIES[lockedSettings.difficulty].size), lockedSettings);
  }, [resetRound, settings]);

  const retryMaze = useCallback(() => {
    resetRound(maze, roundSettings);
  }, [maze, resetRound, roundSettings]);

  const finish = useCallback((finalSteps: number) => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'won';
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
    setElapsed(Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    setSteps(finalSteps);
    setPhase('won');
  }, []);

  const move = useCallback((direction: Direction) => {
    if (phaseRef.current !== 'playing') return;
    const [row, col] = positionRef.current;
    const { dr, dc, wall } = DIRECTIONS[direction];
    if (maze[row][col][wall]) return;
    const next: Position = [row + dr, col + dc];
    if (next[0] < 0 || next[0] >= maze.length || next[1] < 0 || next[1] >= maze.length) return;

    const nextKey = keyOf(next);
    const nextSteps = stepsRef.current + 1;
    positionRef.current = next;
    stepsRef.current = nextSteps;
    setPosition(next);
    setSteps(nextSteps);
    setHintCell(null);
    setTrail((current) => {
      const previousIndex = current.indexOf(nextKey);
      return previousIndex >= 0 ? current.slice(0, previousIndex + 1) : [...current, nextKey];
    });
    if (next[0] === maze.length - 1 && next[1] === maze.length - 1) finish(nextSteps);
  }, [finish, maze]);

  const revealHint = useCallback(() => {
    if (phaseRef.current !== 'playing' || routeToExit.length < 2) return;
    const nextKey = keyOf(routeToExit[1]);
    setHintCell(nextKey);
    setHintsUsed((current) => current + 1);
    if (hintRef.current) clearTimeout(hintRef.current);
    hintRef.current = setTimeout(() => {
      setHintCell(null);
      hintRef.current = null;
    }, 1400);
  }, [routeToExit]);

  const leaveGame = useCallback(() => {
    phaseRef.current = 'setup';
    clearTimers();
    router.dismiss();
  }, [clearTimers]);

  useEffect(() => () => {
    phaseRef.current = 'setup';
    clearTimers();
  }, [clearTimers]);

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ThemedView style={styles.topBar}>
          <Pressable
            accessibilityLabel="返回挑战列表"
            accessibilityRole="button"
            hitSlop={10}
            onPress={leaveGame}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <FontAwesome name="angle-left" size={22} color={BrandColors.aurora} />
            <ThemedText type="smallBold" style={{ color: BrandColors.aurora }}>返回</ThemedText>
          </Pressable>
          <ThemedView style={styles.titleBlock}>
            <ThemedText type="subtitle">星路迷航</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">迷宫 · 空间探索</ThemedText>
          </ThemedView>
          <ThemedView style={styles.topBarSpacer} />
        </ThemedView>

        {phase === 'setup' ? (
          <ScrollView contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={[styles.heroCard, { borderColor: `${BrandColors.aurora}45` }]}>
              <ThemedView style={[styles.heroIcon, { backgroundColor: `${BrandColors.aurora}18` }]}>
                <FontAwesome name="map" size={34} color={BrandColors.aurora} />
              </ThemedView>
              <ThemedView style={styles.heroCopy}>
                <ThemedText style={styles.heroTitle}>穿越未知星域</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.heroDescription}>
                  驾驶探索艇从蓝色入口出发，寻找位于星域另一端的跃迁门。
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.sectionHeading}>
              <ThemedText type="smallBold">航行参数</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">每次生成全新航路</ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.settingsCard}>
              <ThemedView style={styles.settingBlock}>
                <ThemedView style={styles.settingCopy}>
                  <ThemedText type="smallBold">星域规模</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{DIFFICULTIES[settings.difficulty].description}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.optionRow}>
                  {(Object.keys(DIFFICULTIES) as DifficultyKey[]).map((difficulty) => (
                    <OptionChip
                      key={difficulty}
                      label={DIFFICULTIES[difficulty].label}
                      selected={settings.difficulty === difficulty}
                      onPress={() => setSettings((current) => ({ ...current, difficulty }))}
                    />
                  ))}
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.settingDivider, { backgroundColor: theme.backgroundSelected }]} />

              <ThemedView style={styles.settingBlock}>
                <ThemedView style={styles.settingCopy}>
                  <ThemedText type="smallBold">航迹显示</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {settings.showTrail ? '保留当前有效路线，返回时自动回退' : '隐藏行进路线，提高挑战难度'}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.optionRow}>
                  <OptionChip label="显示" selected={settings.showTrail} onPress={() => setSettings((current) => ({ ...current, showTrail: true }))} />
                  <OptionChip label="隐藏" selected={!settings.showTrail} onPress={() => setSettings((current) => ({ ...current, showTrail: false }))} />
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <Pressable
              accessibilityRole="button"
              onPress={startNewMaze}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <FontAwesome name="rocket" size={18} color={BrandColors.deepSpace} />
              <ThemedText style={styles.primaryButtonText}>生成星路并出发</ThemedText>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.gameContent} showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.hud}>
              <HudItem icon="location-arrow" label="步数" value={String(steps)} color={BrandColors.aurora} />
              <HudItem icon="clock-o" label="用时" value={formatTime(elapsed)} color={BrandColors.cometBlue} />
              <HudItem icon="flag-checkered" label="距出口" value={`${remainingSteps} 格`} color={BrandColors.solar} />
            </ThemedView>

            <ThemedView
              type="backgroundElement"
              style={[styles.boardFrame, { width: boardSize + 20, height: boardSize + 20 }]}
            >
              <ThemedView
                accessibilityLabel={`${size} 乘 ${size} 迷宫，当前位置第 ${position[0] + 1} 行第 ${position[1] + 1} 列`}
                style={[styles.board, { width: boardSize, height: boardSize }]}
              >
                {maze.map((row, rowIndex) => row.map((cell, colIndex) => {
                  const cellKey = `${rowIndex},${colIndex}`;
                  return (
                    <MazeCell
                      key={cellKey}
                      cell={cell}
                      cellSize={cellSize}
                      col={colIndex}
                      row={rowIndex}
                      size={size}
                      isCurrent={position[0] === rowIndex && position[1] === colIndex}
                      isExit={rowIndex === size - 1 && colIndex === size - 1}
                      isHint={hintCell === cellKey}
                      isStart={rowIndex === 0 && colIndex === 0}
                      isTrail={roundSettings.showTrail && trailSet.has(cellKey)}
                    />
                  );
                }))}
              </ThemedView>
            </ThemedView>

            {phase === 'playing' ? (
              <>
                <ThemedView style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={revealHint}
                    style={({ pressed }) => [styles.hintButton, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}
                  >
                    <FontAwesome name="compass" size={16} color={BrandColors.cosmicViolet} />
                    <ThemedText type="smallBold" style={{ color: BrandColors.cosmicViolet }}>导航脉冲</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={retryMaze}
                    style={({ pressed }) => [styles.hintButton, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}
                  >
                    <FontAwesome name="undo" size={15} color={theme.textSecondary} />
                    <ThemedText type="smallBold" themeColor="textSecondary">重新出发</ThemedText>
                  </Pressable>
                </ThemedView>
                <DirectionPad onMove={move} />
              </>
            ) : (
              <ThemedView type="backgroundElement" style={[styles.winCard, { borderColor: `${BrandColors.solar}45` }]}>
                <ThemedText style={styles.winEmoji}>🪐</ThemedText>
                <ThemedText type="subtitle">跃迁成功</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {steps} 步 · {formatTime(elapsed)} · 路线效率 {efficiency}%
                </ThemedText>
                <ThemedView style={styles.winStats}>
                  <ResultItem value={optimalSteps} label="最短步数" />
                  <ResultItem value={Math.max(0, steps - optimalSteps)} label="绕行步数" />
                  <ResultItem value={hintsUsed} label="导航次数" />
                </ThemedView>
                <Pressable
                  accessibilityRole="button"
                  onPress={startNewMaze}
                  style={({ pressed }) => [styles.primaryButton, styles.winButton, pressed && styles.pressed]}
                >
                  <FontAwesome name="random" size={17} color={BrandColors.deepSpace} />
                  <ThemedText style={styles.primaryButtonText}>生成新星路</ThemedText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={retryMaze} style={({ pressed }) => [styles.retryTextButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={{ color: BrandColors.cometBlue }}>重走当前迷宫</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const MazeCell = memo(function MazeCell({
  cell,
  cellSize,
  col,
  row,
  size,
  isCurrent,
  isExit,
  isHint,
  isStart,
  isTrail,
}: {
  cell: Cell;
  cellSize: number;
  col: number;
  row: number;
  size: number;
  isCurrent: boolean;
  isExit: boolean;
  isHint: boolean;
  isStart: boolean;
  isTrail: boolean;
}) {
  const theme = useTheme();
  const wallColor = theme.textSecondary;
  return (
    <ThemedView
      style={[
        styles.cell,
        {
          left: col * cellSize,
          top: row * cellSize,
          width: cellSize,
          height: cellSize,
          borderTopWidth: cell.top ? 1.25 : 0,
          borderLeftWidth: cell.left ? 1.25 : 0,
          borderRightWidth: col === size - 1 && cell.right ? 1.25 : 0,
          borderBottomWidth: row === size - 1 && cell.bottom ? 1.25 : 0,
          borderColor: wallColor,
          backgroundColor: isHint
            ? `${BrandColors.cosmicViolet}55`
            : isTrail
              ? `${BrandColors.aurora}18`
              : 'transparent',
        },
      ]}
    >
      {isStart ? <ThemedView style={[styles.endpoint, { backgroundColor: BrandColors.cometBlue }]} /> : null}
      {isExit ? <FontAwesome name="flag-checkered" size={Math.max(9, cellSize * 0.52)} color={BrandColors.solar} /> : null}
      {isCurrent ? (
        <ThemedView style={[styles.ship, { width: Math.max(8, cellSize * 0.48), height: Math.max(8, cellSize * 0.48) }]} />
      ) : null}
    </ThemedView>
  );
});

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionChip,
        { borderColor: selected ? BrandColors.aurora : theme.backgroundSelected },
        selected && styles.optionChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="smallBold" style={selected ? styles.optionChipSelectedText : undefined}>{label}</ThemedText>
    </Pressable>
  );
}

function HudItem({ icon, label, value, color }: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.hudItem}>
      <FontAwesome name={icon} size={14} color={color} />
      <ThemedView style={styles.hudCopy}>
        <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
        <ThemedText style={styles.hudValue}>{value}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function DirectionPad({ onMove }: { onMove: (direction: Direction) => void }) {
  return (
    <ThemedView style={styles.directionPad}>
      <ThemedView style={styles.directionRow}>
        <ThemedView style={styles.directionSpacer} />
        <DirectionButton direction="up" onPress={onMove} />
        <ThemedView style={styles.directionSpacer} />
      </ThemedView>
      <ThemedView style={styles.directionRow}>
        <DirectionButton direction="left" onPress={onMove} />
        <ThemedView type="backgroundElement" style={styles.directionCenter}>
          <FontAwesome name="location-arrow" size={15} color={BrandColors.aurora} />
        </ThemedView>
        <DirectionButton direction="right" onPress={onMove} />
      </ThemedView>
      <ThemedView style={styles.directionRow}>
        <ThemedView style={styles.directionSpacer} />
        <DirectionButton direction="down" onPress={onMove} />
        <ThemedView style={styles.directionSpacer} />
      </ThemedView>
    </ThemedView>
  );
}

function DirectionButton({ direction, onPress }: { direction: Direction; onPress: (direction: Direction) => void }) {
  const config = DIRECTIONS[direction];
  return (
    <Pressable
      accessibilityLabel={config.label}
      accessibilityRole="button"
      onPress={() => onPress(direction)}
      style={({ pressed }) => [styles.directionButton, pressed && styles.directionPressed]}
    >
      <FontAwesome name={config.icon} size={20} color={BrandColors.aurora} />
    </Pressable>
  );
}

function ResultItem({ value, label }: { value: number; label: string }) {
  return (
    <ThemedView style={styles.resultItem}>
      <ThemedText style={styles.resultValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: 600, paddingHorizontal: Spacing.four },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  topBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  titleBlock: { alignItems: 'center', gap: 1 },
  topBarSpacer: { width: 72 },
  setupContent: { paddingTop: Spacing.two, paddingBottom: Spacing.five, gap: Spacing.three },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: 22, padding: Spacing.four, borderWidth: 1 },
  heroIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: Spacing.one },
  heroTitle: { fontWeight: '700' },
  heroDescription: { lineHeight: 19 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.one },
  settingsCard: { borderRadius: 22, paddingHorizontal: Spacing.three },
  settingBlock: { minHeight: 94, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, paddingVertical: Spacing.three },
  settingCopy: { flex: 1, gap: 3 },
  settingDivider: { height: StyleSheet.hairlineWidth },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  optionChip: { minWidth: 54, height: 36, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionChipSelected: { backgroundColor: BrandColors.aurora, borderColor: BrandColors.aurora },
  optionChipSelectedText: { color: BrandColors.deepSpace },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: BrandColors.aurora, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  primaryButtonText: { color: BrandColors.deepSpace, fontSize: 16, fontWeight: '800' },
  gameContent: { alignItems: 'center', paddingTop: Spacing.two, paddingBottom: Spacing.five, gap: Spacing.three },
  hud: { width: '100%', flexDirection: 'row', gap: Spacing.two },
  hudItem: { flex: 1, minWidth: 0, minHeight: 58, borderRadius: 16, paddingHorizontal: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  hudCopy: { gap: 1 },
  hudValue: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  boardFrame: { borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  board: { position: 'relative' },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  endpoint: { position: 'absolute', width: 5, height: 5, borderRadius: 3 },
  ship: { borderRadius: 999, backgroundColor: BrandColors.cometBlue, borderWidth: 2, borderColor: BrandColors.starlight },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  hintButton: { minHeight: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  directionPad: { gap: Spacing.one, alignItems: 'center' },
  directionRow: { flexDirection: 'row', gap: Spacing.one },
  directionButton: { width: 50, height: 46, borderRadius: 15, backgroundColor: `${BrandColors.aurora}16`, borderWidth: 1, borderColor: `${BrandColors.aurora}45`, alignItems: 'center', justifyContent: 'center' },
  directionPressed: { backgroundColor: `${BrandColors.aurora}35`, transform: [{ scale: 0.94 }] },
  directionSpacer: { width: 50, height: 46 },
  directionCenter: { width: 50, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  winCard: { width: '100%', borderRadius: 22, padding: Spacing.four, borderWidth: 1, alignItems: 'center', gap: Spacing.two },
  winEmoji: { fontSize: 48, lineHeight: 58 },
  winStats: { width: '100%', flexDirection: 'row', paddingVertical: Spacing.two },
  resultItem: { flex: 1, alignItems: 'center', gap: 2 },
  resultValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  winButton: { width: '100%', paddingHorizontal: Spacing.four },
  retryTextButton: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four },
});
