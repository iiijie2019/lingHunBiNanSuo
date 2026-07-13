import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const SIZE = 15;
const CELL = 22;

type Cell = 'black' | 'white' | null;

function checkWin(board: Cell[][], row: number, col: number, player: 'black' | 'white'): boolean {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < 5; i++) { const r = row + dr*i, c = col + dc*i; if (r>=0 && r<SIZE && c>=0 && c<SIZE && board[r][c]===player) count++; else break; }
    for (let i = 1; i < 5; i++) { const r = row - dr*i, c = col - dc*i; if (r>=0 && r<SIZE && c>=0 && c<SIZE && board[r][c]===player) count++; else break; }
    if (count >= 5) return true;
  }
  return false;
}

function aiMove(board: Cell[][]): [number, number] | null {
  let best = -1, bestR = 7, bestC = 7;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) continue;
      const score = evaluatePos(board, r, c, 'white') + evaluatePos(board, r, c, 'black') * 0.9;
      if (score > best) { best = score; bestR = r; bestC = c; }
    }
  }
  return [bestR, bestC];
}

function evaluatePos(board: Cell[][], row: number, col: number, player: Cell): number {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let total = 0;
  for (const [dr, dc] of dirs) {
    let count = 1, open = 0;
    for (let i = 1; i < 5; i++) { const r = row + dr*i, c = col + dc*i; if (r>=0 && r<SIZE && c>=0 && c<SIZE && board[r][c]===player) count++; else { if (r>=0&&r<SIZE&&c>=0&&c<SIZE&&!board[r][c]) open++; break; } }
    for (let i = 1; i < 5; i++) { const r = row - dr*i, c = col - dc*i; if (r>=0 && r<SIZE && c>=0 && c<SIZE && board[r][c]===player) count++; else { if (r>=0&&r<SIZE&&c>=0&&c<SIZE&&!board[r][c]) open++; break; } }
    if (count >= 5) total += 10000;
    else if (count === 4 && open >= 1) total += 1000;
    else if (count === 3 && open >= 1) total += 100;
    else if (count === 2 && open >= 2) total += 10;
  }
  return total;
}

export default function GomokuScreen() {
  const [board, setBoard] = useState<Cell[][]>(() => Array.from({length:SIZE},()=>Array(SIZE).fill(null)));
  const [turn, setTurn] = useState<'black'|'white'>('black');
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<[number,number]|null>(null);
  const thinkingRef = useRef(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = useCallback((r: number, c: number) => {
    if (board[r][c] || winner || thinkingRef.current || turn !== 'black') return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 'black';
    setBoard(newBoard);
    setLastMove([r, c]);
    if (checkWin(newBoard, r, c, 'black')) { setWinner('你赢了！🎉'); return; }
    if (newBoard.every(row => row.every(cell => cell))) { setWinner('平局'); return; }
    setTurn('white');
    thinkingRef.current = true;
    aiTimerRef.current = setTimeout(() => {
      const ai = aiMove(newBoard);
      if (ai) {
        const [ar, ac] = ai;
        const aiBoard = newBoard.map((row) => [...row]);
        aiBoard[ar][ac] = 'white';
        setBoard(aiBoard);
        setLastMove([ar, ac]);
        if (checkWin(aiBoard, ar, ac, 'white')) { setWinner('AI 赢了'); thinkingRef.current = false; return; }
      }
      setTurn('black');
      thinkingRef.current = false;
    }, 200);
  }, [board, winner, turn]);

  const reset = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setBoard(Array.from({length:SIZE},()=>Array(SIZE).fill(null)));
    setTurn('black');
    setWinner(null);
    setLastMove(null);
    thinkingRef.current = false;
  };

  useEffect(() => () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  const boardPixel = CELL * SIZE;

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}><FontAwesome name="angle-left" size={18} color="#FF9500" /></ThemedView>
            <ThemedText type="small" style={{ color: '#FF9500' }}>返回</ThemedText>
          </Pressable>

          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">五子棋</ThemedText>
            <ThemedView style={styles.turnBadge}>
              <ThemedView style={[styles.stoneMini, { backgroundColor: turn === 'black' ? '#1a1a1a' : '#f5f5f5', borderWidth: turn === 'white' ? 1 : 0, borderColor: '#999' }]} />
              <ThemedText type="smallBold">{winner ? winner : `${turn === 'black' ? '你执黑' : 'AI 执白'}`}</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Board with grid lines */}
          <ThemedView type="backgroundElement" style={styles.boardWrap}>
            <View style={[styles.board, { width: boardPixel, height: boardPixel }]}>
              {/* Grid lines - horizontal */}
              {Array.from({length:SIZE}).map((_, r) => (
                <View key={`h-${r}`} style={{ position:'absolute', left:0, top: r*CELL + CELL/2, width: boardPixel, height: 1, backgroundColor: '#C0C0C0' }} />
              ))}
              {/* Grid lines - vertical */}
              {Array.from({length:SIZE}).map((_, c) => (
                <View key={`v-${c}`} style={{ position:'absolute', top:0, left: c*CELL + CELL/2, height: boardPixel, width: 1, backgroundColor: '#C0C0C0' }} />
              ))}
              {/* Star points */}
              {[[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]].map(([r,c]) => (
                <View key={`s-${r}-${c}`} style={{ position:'absolute', left: c*CELL + CELL/2 - 3, top: r*CELL + CELL/2 - 3, width:6, height:6, borderRadius:3, backgroundColor:'#888' }} />
              ))}
              {/* Stones */}
              {board.map((row, r) =>
                row.map((cell, c) => {
                  if (!cell) return null;
                  const isLast = lastMove && lastMove[0] === r && lastMove[1] === c;
                  return (
                    <View key={`${r}-${c}`} style={{
                      position:'absolute', left: c*CELL + 2, top: r*CELL + 2,
                      width: CELL - 4, height: CELL - 4, borderRadius: (CELL-4)/2,
                      backgroundColor: cell === 'black' ? '#1a1a1a' : '#f0f0f0',
                      borderWidth: cell === 'white' ? 1 : 0, borderColor: '#ccc',
                      ...(isLast ? { borderWidth: 2, borderColor: '#FF3B30' } : {}),
                    }} />
                  );
                })
              )}
              {/* Touch layer */}
              {board.map((row, r) =>
                row.map((_, c) => (
                  <Pressable key={`t-${r}-${c}`} onPress={() => place(r, c)} style={{
                    position:'absolute', left: c*CELL, top: r*CELL, width: CELL, height: CELL,
                  }} />
                ))
              )}
            </View>
          </ThemedView>

          {(winner || board.some(r => r.some(c => c))) && (
            <Pressable style={styles.resetBtn} onPress={reset}>
              <FontAwesome name="refresh" size={16} color="#FFF" />
              <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>重新开始</ThemedText>
            </Pressable>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { paddingBottom: Spacing.six, alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start', width: '100%' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FF950012', alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  turnBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: '#FF950012', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 16 },
  stoneMini: { width: 16, height: 16, borderRadius: 8 },

  boardWrap: { padding: Spacing.two, borderRadius: Spacing.three, marginTop: Spacing.three },
  board: { position: 'relative', backgroundColor: '#DEB887' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9500', paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, borderRadius: Spacing.three, gap: Spacing.two, marginTop: Spacing.three },
});
