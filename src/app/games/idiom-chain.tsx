import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const IDIOMS = [
  '一心一意','意气风发','发愤图强','强人所难','难能可贵','贵在坚持','持之以恒','恒久不变','变化万千',
  '千山万水','水到渠成','成竹在胸','胸怀大志','志在四方','方兴未艾','艾发衰容','容光焕发','发人深省',
  '省吃俭用','用心良苦','苦尽甘来','来日方长','长驱直入','入木三分','分秒必争','争先恐后','后来居上',
  '上行下效','效犬马力','力争上游','游刃有余','余音绕梁','梁上君子','子虚乌有','有目共睹','睹物思人',
  '人山人海','海阔天空','空前绝后','后生可畏','畏缩不前','前仆后继','继往开来','来者不拒','拒人千里',
  '里应外合','合二为一','一帆风顺','顺水推舟','舟车劳顿','顿开茅塞','塞翁失马','马到成功','功成名就',
  '就事论事','事半功倍','倍日并行','行尸走肉','肉眼凡胎','胎死腹中','中庸之道','道听途说','说三道四',
  '四面楚歌','歌舞升平','平步青云','云开日出','出口成章','章台杨柳','柳暗花明','明辨是非','非同小可',
  '可歌可泣','泣不成声','声东击西','西装革履','履薄临深','深入浅出','出类拔萃','萃于一堂','堂堂正正',
  '正气凛然','然荻读书','书香门第','第一夫人','人心所向','向隅而泣','泣血捶膺','英才施教','教学相长',
  '长风破浪','浪子回头','头头是道','道高一尺','尺短寸长','长年累月','月光如水','水滴石穿','穿针引线',
  '线索分明','明知故犯','犯而不校','校短推长','长短不一','一诺千金','金玉良言','言传身教','教化天下',
  '下笔成文','文不加点','点石成金','金碧辉煌','煌煌大观','观望不前','前无古人','人才辈出','出其不意',
  '意气用事','事在人为','为人师表','表里如一','一日三秋','秋风过耳','耳目一新','新陈代谢','谢天谢地',
  '地大物博','博览群书','书生之见','见义勇为','为人正直','直截了当','当机立断','断章取义','义不容辞',
  '辞旧迎新','谢绝参观','冠冕堂皇','皇天后土','土崩瓦解','解囊相助','助人为乐','乐极生悲','悲欢离合',
  '合情合理','理直气壮','壮志凌云','云蒸霞蔚','蔚然成风','风调雨顺','顺藤摸瓜','瓜田李下','下不为例',
  '例行公事','事必躬亲','亲密无间','间不容发','发愤忘食','食不甘味','味同嚼蜡','拉帮结派',
];

const index: Record<string, string[]> = {};
IDIOMS.forEach((i) => {
  const key = i[0];
  if (!index[key]) index[key] = [];
  index[key].push(i);
});

export default function IdiomChainScreen() {
  const isDark = useColorScheme() === 'dark';
  const [chain, setChain] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const inputRef = useRef<TextInput>(null);

  const start = () => {
    setChain([]);
    setInput('');
    setMessage('');
    setScore(0);
    setPlaying(true);
    setTurn('player');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submit = useCallback(() => {
    const word = input.trim();
    if (!word) return;
    if (word.length !== 4) { setMessage('请输入四个字的成语'); return; }
    if (!IDIOMS.includes(word)) { setMessage('这个成语不在词库中，换一个试试'); return; }

    if (chain.length > 0) {
      const lastWord = chain[chain.length - 1];
      const lastChar = lastWord[3];
      if (word[0] !== lastChar) { setMessage(`需要以"${lastChar}"开头`); return; }
    }

    if (chain.includes(word)) { setMessage('这个成语已经用过了'); return; }

    const newChain = [...chain, word];
    setChain(newChain);
    setInput('');
    setMessage('');
    setScore((s) => s + 1);
    setTurn('ai');

    // AI response
    setTimeout(() => {
      const lastChar = word[3];
      const candidates = (index[lastChar] || []).filter((i) => !newChain.includes(i));
      if (candidates.length > 0) {
        const aiPick = candidates[Math.floor(Math.random() * candidates.length)];
        setChain((c) => [...c, aiPick]);
        setTurn('player');
        inputRef.current?.focus();
      } else {
        setMessage('🎉 AI 接不上了！你赢了！');
        setTurn('player');
      }
    }, 500);
  }, [input, chain]);

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}><FontAwesome name="angle-left" size={18} color="#AF52DE" /></ThemedView>
            <ThemedText type="small" style={{ color: '#AF52DE' }}>返回</ThemedText>
          </Pressable>

          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">成语接龙</ThemedText>
            {playing && (
              <ThemedView style={styles.scoreBadge}>
                <ThemedText type="smallBold" style={{ color: '#AF52DE' }}>得分: {score}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {!playing ? (
            <ThemedView type="backgroundElement" style={styles.startCard}>
              <ThemedText style={styles.startEmoji}>📝</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                输入一个成语开始，之后需要以上一个成语的最后一个字开头
              </ThemedText>
              <Pressable style={styles.startBtn} onPress={start}>
                <FontAwesome name="play" size={16} color="#FFF" />
                <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>开始游戏</ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <>
              {/* Chain display */}
              {chain.length > 0 && (
                <ThemedView type="backgroundElement" style={styles.chainCard}>
                  <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                    {chain.map((w, i) => (
                      <ThemedView key={i} style={[styles.chainItem, i % 2 === 0 ? styles.chainPlayer : styles.chainAI]}>
                        <ThemedText type="small" style={{ color: i % 2 === 0 ? '#AF52DE' : '#FF9500', width: 28 }}>{i % 2 === 0 ? '🧑' : '🤖'}</ThemedText>
                        <ThemedView style={{ flex: 1 }}>
                          <ThemedText style={styles.chainWord}>{w}</ThemedText>
                        </ThemedView>
                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13, width: 20, textAlign: 'center' }}>
                          {i < chain.length - 1 ? '→' : ''}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </ScrollView>
                </ThemedView>
              )}

              {chain.length > 0 && (
                <ThemedView style={styles.hintRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    上一个尾字:{' '}
                    <ThemedText style={{ fontWeight: '700', color: turn === 'player' ? '#AF52DE' : '#FF9500', fontSize: 20 }}>
                      {chain[chain.length - 1][3]}
                    </ThemedText>
                    {' '}请接龙
                  </ThemedText>
                </ThemedView>
              )}

              {/* Input */}
              {turn === 'player' && (
                <ThemedView style={styles.inputRow}>
                  <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                    <TextInput ref={inputRef} style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
                      placeholder={chain.length === 0 ? "任意输入一个成语开始..." : "输入以尾字开头的成语..."}
                      placeholderTextColor="#999" value={input}
                      onChangeText={setInput} onSubmitEditing={submit} autoFocus />
                  </ThemedView>
                  <Pressable style={styles.goBtn} onPress={submit}>
                    <ThemedText style={{ color: '#FFF', fontWeight: '700' }}>接</ThemedText>
                  </Pressable>
                </ThemedView>
              )}

              {turn === 'ai' && (
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.three }}>
                  🤖 AI 正在思考...
                </ThemedText>
              )}

              {message !== '' && (
                <ThemedText type="small" style={{ textAlign: 'center', marginTop: Spacing.two, color: message.includes('赢') ? '#34C759' : '#FF6B6B', fontWeight: '600' }}>{message}</ThemedText>
              )}

              <Pressable style={styles.restartBtn} onPress={start}>
                <ThemedText type="small" themeColor="textSecondary">重新开始</ThemedText>
              </Pressable>
            </>
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
  scroll: { paddingBottom: Spacing.six },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#AF52DE12', alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreBadge: { backgroundColor: '#AF52DE12', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 16 },

  startCard: { marginTop: Spacing.five, padding: Spacing.six, borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.three },
  startEmoji: { fontSize: 56, lineHeight: 68 },
  startBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#AF52DE', paddingVertical: Spacing.three, paddingHorizontal: Spacing.six, borderRadius: Spacing.three, gap: Spacing.two },

  chainCard: { marginTop: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three },
  chainItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, borderRadius: Spacing.one },
  chainPlayer: { backgroundColor: '#AF52DE10' },
  chainAI: { backgroundColor: '#FF950010' },
  chainWord: { fontSize: 20, fontWeight: '600' },

  hintRow: { marginTop: Spacing.three, alignItems: 'center', paddingVertical: Spacing.two },
  inputRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  inputWrapper: { flex: 1, borderRadius: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1.5, borderColor: '#AF52DE30' },
  input: { fontSize: 22, fontWeight: '600', textAlign: 'center', padding: 0, lineHeight: 28 },
  goBtn: { backgroundColor: '#AF52DE', paddingHorizontal: 28, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  restartBtn: { alignItems: 'center', marginTop: Spacing.three, paddingVertical: Spacing.one },
});
