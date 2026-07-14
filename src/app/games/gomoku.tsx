import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 15;
const ACCENT = BrandColors.solar;
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;
const STAR_POINTS = [[3, 3], [3, 7], [3, 11], [7, 3], [7, 7], [7, 11], [11, 3], [11, 7], [11, 11]] as const;

type Player = 'black' | 'white';
type Cell = Player | null;
type GameResult = Player | 'draw' | null;

function createBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

function isInside(row: number, col: number) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function isBoardFull(board: Cell[][]) {
  return board.every((row) => row.every(Boolean));
}

function getWinningCells(board: Cell[][], row: number, col: number, player: Player): string[] {
  for (const [rowStep, colStep] of DIRECTIONS) {
    const cells: [number, number][] = [[row, col]];

    for (const direction of [-1, 1] as const) {
      for (let distance = 1; distance < SIZE; distance++) {
        const nextRow = row + rowStep * distance * direction;
        const nextCol = col + colStep * distance * direction;
        if (!isInside(nextRow, nextCol) || board[nextRow][nextCol] !== player) break;
        if (direction === -1) cells.unshift([nextRow, nextCol]);
        else cells.push([nextRow, nextCol]);
      }
    }

    if (cells.length >= 5) return cells.map(([cellRow, cellCol]) => `${cellRow}-${cellCol}`);
  }

  return [];
}

function evaluatePosition(board: Cell[][], row: number, col: number, player: Player) {
  let total = 0;

  for (const [rowStep, colStep] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    for (const direction of [-1, 1] as const) {
      let distance = 1;
      while (distance < 5) {
        const nextRow = row + rowStep * distance * direction;
        const nextCol = col + colStep * distance * direction;
        if (!isInside(nextRow, nextCol)) break;
        if (board[nextRow][nextCol] === player) {
          count++;
          distance++;
          continue;
        }
        if (board[nextRow][nextCol] === null) openEnds++;
        break;
      }
    }

    if (count >= 5) total += 100000;
    else if (count === 4) total += openEnds === 2 ? 15000 : openEnds === 1 ? 6000 : 0;
    else if (count === 3) total += openEnds === 2 ? 1600 : openEnds === 1 ? 350 : 0;
    else if (count === 2) total += openEnds === 2 ? 140 : openEnds === 1 ? 35 : 0;
    else if (openEnds === 2) total += 4;
  }

  return total;
}

function hasNearbyStone(board: Cell[][], row: number, col: number) {
  for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
    for (let colOffset = -2; colOffset <= 2; colOffset++) {
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (isInside(nextRow, nextCol) && board[nextRow][nextCol]) return true;
    }
  }
  return false;
}

function chooseAiMove(board: Cell[][]): [number, number] | null {
  let bestScore = -Infinity;
  let bestMoves: [number, number][] = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] || !hasNearbyStone(board, row, col)) continue;

      const attack = evaluatePosition(board, row, col, 'white');
      const defense = evaluatePosition(board, row, col, 'black');
      const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
      const score = attack * 1.08 + defense + (14 - centerDistance) * 0.15;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [[row, col]];
      } else if (score === bestScore) {
        bestMoves.push([row, col]);
      }
    }
  }

  if (bestMoves.length === 0) return board[7][7] ? null : [7, 7];
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export default function GomokuScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [turn, setTurn] = useState<Player>('black');
  const [result, setResult] = useState<GameResult>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [winningCells, setWinningCells] = useState<string[]>([]);
  const thinkingRef = useRef(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boardPixel = Math.min(360, windowWidth - Spacing.three * 2);
  const cellSize = boardPixel / SIZE;
  const stoneSize = cellSize * 0.78;
  const moveCount = useMemo(() => board.reduce(
    (total, row) => total + row.filter(Boolean).length,
    0,
  ), [board]);

  const finishGame = (nextResult: Exclude<GameResult, null>, cells: string[] = []) => {
    setResult(nextResult);
    setWinningCells(cells);
    thinkingRef.current = false;
  };

  const place = useCallback((row: number, col: number) => {
    if (board[row][col] || result || thinkingRef.current || turn !== 'black') return;

    const playerBoard = board.map((boardRow) => [...boardRow]);
    playerBoard[row][col] = 'black';
    setBoard(playerBoard);
    setLastMove([row, col]);

    const playerWin = getWinningCells(playerBoard, row, col, 'black');
    if (playerWin.length > 0) {
      finishGame('black', playerWin);
      return;
    }
    if (isBoardFull(playerBoard)) {
      finishGame('draw');
      return;
    }

    setTurn('white');
    thinkingRef.current = true;
    aiTimerRef.current = setTimeout(() => {
      const aiMove = chooseAiMove(playerBoard);
      if (!aiMove) {
        finishGame('draw');
        return;
      }

      const [aiRow, aiCol] = aiMove;
      const aiBoard = playerBoard.map((boardRow) => [...boardRow]);
      aiBoard[aiRow][aiCol] = 'white';
      setBoard(aiBoard);
      setLastMove([aiRow, aiCol]);

      const aiWin = getWinningCells(aiBoard, aiRow, aiCol, 'white');
      if (aiWin.length > 0) {
        finishGame('white', aiWin);
        return;
      }
      if (isBoardFull(aiBoard)) {
        finishGame('draw');
        return;
      }

      setTurn('black');
      thinkingRef.current = false;
    }, 420);
  }, [board, result, turn]);

  const reset = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setBoard(createBoard());
    setTurn('black');
    setResult(null);
    setLastMove(null);
    setWinningCells([]);
    thinkingRef.current = false;
  };

  useEffect(() => () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  const statusTitle = result === 'black'
    ? '你赢了！'
    : result === 'white'
      ? 'AI 获胜'
      : result === 'draw'
        ? '本局平局'
        : turn === 'white'
          ? 'AI 正在思考…'
          : moveCount === 0 ? '等待你的第一手' : '轮到你落子';
  const statusHint = result
    ? `本局共落下 ${moveCount} 枚棋子`
    : turn === 'black' ? '你执黑棋，率先连成五子获胜' : 'AI 执白棋，请稍候';

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="返回上一页"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.dismiss()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="angle-left" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>返回</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${ACCENT}20` }]}>
              <FontAwesome name="circle-thin" size={23} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>五子棋</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">执黑先行，与 AI 对弈一局</ThemedText>
            </View>
          </View>

          <ThemedView
            type="backgroundElement"
            style={[styles.statusCard, { borderColor: result ? `${ACCENT}55` : theme.backgroundSelected }]}
          >
            <View style={styles.statusMain}>
              <View style={[
                styles.turnStone,
                turn === 'black' ? styles.blackStone : styles.whiteStone,
              ]}>
                <View style={styles.stoneShine} />
              </View>
              <View style={styles.statusCopy}>
                <ThemedText style={[styles.statusTitle, result === 'black' && { color: ACCENT }]}>
                  {statusTitle}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{statusHint}</ThemedText>
              </View>
            </View>
            <View style={[styles.moveBadge, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">第 {Math.floor(moveCount / 2) + 1} 手</ThemedText>
            </View>
          </ThemedView>

          <View style={styles.boardFrame}>
            <View style={[styles.board, { width: boardPixel, height: boardPixel }]}>
              {Array.from({ length: SIZE }).map((_, row) => (
                <View
                  key={`horizontal-${row}`}
                  style={{
                    position: 'absolute', left: cellSize / 2, top: row * cellSize + cellSize / 2,
                    width: boardPixel - cellSize, height: StyleSheet.hairlineWidth,
                    backgroundColor: 'rgba(80, 43, 8, 0.62)',
                  }}
                />
              ))}
              {Array.from({ length: SIZE }).map((_, col) => (
                <View
                  key={`vertical-${col}`}
                  style={{
                    position: 'absolute', top: cellSize / 2, left: col * cellSize + cellSize / 2,
                    height: boardPixel - cellSize, width: StyleSheet.hairlineWidth,
                    backgroundColor: 'rgba(80, 43, 8, 0.62)',
                  }}
                />
              ))}
              {STAR_POINTS.map(([row, col]) => (
                <View
                  key={`star-${row}-${col}`}
                  style={[
                    styles.starPoint,
                    { left: col * cellSize + cellSize / 2 - 2.5, top: row * cellSize + cellSize / 2 - 2.5 },
                  ]}
                />
              ))}

              {board.map((boardRow, row) => boardRow.map((cell, col) => {
                if (!cell) return null;
                const cellKey = `${row}-${col}`;
                const isLastMove = lastMove?.[0] === row && lastMove?.[1] === col;
                const isWinning = winningCells.includes(cellKey);
                return (
                  <View
                    key={cellKey}
                    style={[
                      styles.stone,
                      cell === 'black' ? styles.blackStone : styles.whiteStone,
                      isWinning && styles.winningStone,
                      {
                        left: col * cellSize + (cellSize - stoneSize) / 2,
                        top: row * cellSize + (cellSize - stoneSize) / 2,
                        width: stoneSize,
                        height: stoneSize,
                        borderRadius: stoneSize / 2,
                      },
                    ]}
                  >
                    <View style={styles.stoneShine} />
                    {isLastMove ? <View style={[styles.lastMoveDot, cell === 'black' && styles.lastMoveDotOnBlack]} /> : null}
                  </View>
                );
              }))}

              {board.map((boardRow, row) => boardRow.map((cell, col) => (
                <Pressable
                  accessibilityLabel={`棋盘第 ${row + 1} 行第 ${col + 1} 列${cell ? `，${cell === 'black' ? '黑棋' : '白棋'}` : '，空位'}`}
                  accessibilityRole="button"
                  disabled={Boolean(cell) || Boolean(result) || turn !== 'black'}
                  key={`touch-${row}-${col}`}
                  onPress={() => place(row, col)}
                  style={{
                    position: 'absolute', left: col * cellSize, top: row * cellSize,
                    width: cellSize, height: cellSize,
                  }}
                />
              )))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={reset}
            style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          >
            <FontAwesome name="refresh" size={16} color="#5C3500" />
            <ThemedText style={styles.resetButtonText}>{result ? '再来一局' : '重新开局'}</ThemedText>
          </Pressable>

          <View style={styles.noteRow}>
            <FontAwesome name="info-circle" size={13} color={BrandColors.meteor} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              红点标记最后一手，金色描边标记获胜棋子
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  backButton: {
    minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  headerTitle: { fontSize: 30, lineHeight: 38 },
  statusCard: {
    width: '100%', minHeight: 76, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: Spacing.three, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, gap: Spacing.two,
  },
  statusMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  statusCopy: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: 17, lineHeight: 24, fontWeight: '800' },
  turnStone: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'flex-start', justifyContent: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.24, shadowRadius: 4,
  },
  moveBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  boardFrame: {
    padding: 8, borderRadius: 22, backgroundColor: '#8E550F',
    shadowColor: '#5A3106', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28, shadowRadius: 18, elevation: 8,
  },
  board: { position: 'relative', borderRadius: 15, backgroundColor: '#E5B766', overflow: 'hidden' },
  starPoint: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#67400F' },
  stone: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.32,
    shadowRadius: 2, elevation: 3,
  },
  blackStone: { backgroundColor: '#17202A', borderWidth: 1, borderColor: '#05080B' },
  whiteStone: { backgroundColor: '#F8F4E8', borderWidth: 1, borderColor: '#C8BFAE' },
  winningStone: { borderWidth: 2, borderColor: '#FFB000' },
  stoneShine: {
    width: '27%', height: '27%', borderRadius: 99, marginLeft: '20%', marginTop: '13%',
    backgroundColor: 'rgba(255,255,255,0.38)', alignSelf: 'flex-start',
  },
  lastMoveDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#E33636' },
  lastMoveDotOnBlack: { backgroundColor: '#FF6666' },
  resetButton: {
    width: '100%', minHeight: 52, borderRadius: 18, backgroundColor: ACCENT,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2,
    shadowRadius: 10, elevation: 4,
  },
  resetButtonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  resetButtonText: { color: '#5C3500', fontSize: 16, fontWeight: '800' },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  noteText: { flexShrink: 1, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
