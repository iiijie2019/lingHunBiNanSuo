import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore } from '@/stores/useStore';

const GRID_SIZE = 9;
const BOMB_CHANCE = 0.22;
const BOMB_PENALTY = 3;

type Phase = 'setup' | 'playing' | 'finished';
type PaceKey = 'relaxed' | 'standard' | 'rapid';
type Target = { id: number; hole: number; type: 'mole' | 'bomb' };
type Flash = { hole: number; type: 'mole' | 'bomb' };

type GameSettings = {
  duration: 30 | 60 | 99;
  pace: PaceKey;
  bombs: boolean;
  comboBonus: boolean;
};

type RoundStats = {
  molesHit: number;
  molesMissed: number;
  bombsHit: number;
  emptyTaps: number;
  maxCombo: number;
};

const PACE_OPTIONS: Record<PaceKey, {
  label: string;
  description: string;
  visibleMs: number;
  spawnMinMs: number;
  spawnMaxMs: number;
}> = {
  relaxed: { label: '舒缓', description: '目标停留更久', visibleMs: 1050, spawnMinMs: 480, spawnMaxMs: 850 },
  standard: { label: '标准', description: '速度适中', visibleMs: 780, spawnMinMs: 300, spawnMaxMs: 620 },
  rapid: { label: '极速', description: '连续快速出现', visibleMs: 540, spawnMinMs: 150, spawnMaxMs: 360 },
};

const DEFAULT_SETTINGS: GameSettings = {
  duration: 30,
  pace: 'standard',
  bombs: true,
  comboBonus: true,
};

const EMPTY_STATS: RoundStats = {
  molesHit: 0,
  molesMissed: 0,
  bombsHit: 0,
  emptyTaps: 0,
  maxCombo: 0,
};

export default function WhackAMoleScreen() {
  const theme = useTheme();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.whackAMole;

  const [phase, setPhase] = useState<Phase>('setup');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_SETTINGS.duration);
  const [target, setTarget] = useState<Target | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [result, setResult] = useState<RoundStats>(EMPTY_STATS);

  const phaseRef = useRef<Phase>('setup');
  const settingsRef = useRef<GameSettings>(DEFAULT_SETTINGS);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const statsRef = useRef<RoundStats>({ ...EMPTY_STATS });
  const targetRef = useRef<Target | null>(null);
  const targetIdRef = useRef(0);
  const lastHoleRef = useRef<number | null>(null);
  const endAtRef = useRef(0);
  const gameSavedRef = useRef(false);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSpawnRef = useRef<(delayMs: number) => void>(() => {});
  const finishGameRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (targetTimerRef.current) clearTimeout(targetTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    clockRef.current = null;
    targetTimerRef.current = null;
    flashTimerRef.current = null;
  }, []);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  finishGameRef.current = () => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'finished';
    clearTimers();
    targetRef.current = null;
    setTarget(null);
    setTimeLeft(0);
    setPhase('finished');

    const finalStats = { ...statsRef.current };
    const attempts = finalStats.molesHit + finalStats.molesMissed;
    const accuracy = attempts > 0 ? Math.round((finalStats.molesHit / attempts) * 100) : 0;
    setResult(finalStats);

    if (!gameSavedRef.current) {
      gameSavedRef.current = true;
      dispatch({
        type: 'SAVE_GAME_RECORD',
        game: 'whackAMole',
        score: scoreRef.current,
        extra1: finalStats.maxCombo,
        extra2: accuracy,
      });
    }
  };

  scheduleSpawnRef.current = (delayMs: number) => {
    if (targetTimerRef.current) clearTimeout(targetTimerRef.current);
    targetTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== 'playing') return;
      if (Date.now() >= endAtRef.current) {
        finishGameRef.current();
        return;
      }

      let hole = Math.floor(Math.random() * GRID_SIZE);
      if (hole === lastHoleRef.current) hole = (hole + 1 + Math.floor(Math.random() * (GRID_SIZE - 1))) % GRID_SIZE;
      lastHoleRef.current = hole;

      const config = settingsRef.current;
      const nextTarget: Target = {
        id: ++targetIdRef.current,
        hole,
        type: config.bombs && Math.random() < BOMB_CHANCE ? 'bomb' : 'mole',
      };
      targetRef.current = nextTarget;
      setTarget(nextTarget);

      targetTimerRef.current = setTimeout(() => {
        if (phaseRef.current !== 'playing' || targetRef.current?.id !== nextTarget.id) return;
        if (nextTarget.type === 'mole') statsRef.current.molesMissed += 1;
        comboRef.current = 0;
        setCombo(0);
        targetRef.current = null;
        setTarget(null);
        const pace = PACE_OPTIONS[config.pace];
        const gap = pace.spawnMinMs + Math.random() * (pace.spawnMaxMs - pace.spawnMinMs);
        scheduleSpawnRef.current(gap);
      }, PACE_OPTIONS[config.pace].visibleMs);
    }, delayMs);
  };

  const startGame = useCallback(() => {
    clearTimers();
    const roundSettings = { ...settings };
    settingsRef.current = roundSettings;
    phaseRef.current = 'playing';
    scoreRef.current = 0;
    comboRef.current = 0;
    statsRef.current = { ...EMPTY_STATS };
    targetRef.current = null;
    lastHoleRef.current = null;
    gameSavedRef.current = false;
    endAtRef.current = Date.now() + roundSettings.duration * 1000;

    setPhase('playing');
    setScore(0);
    setCombo(0);
    setTimeLeft(roundSettings.duration);
    setTarget(null);
    setFlash(null);

    clockRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft((current) => current === remaining ? current : remaining);
      if (remaining <= 0) finishGameRef.current();
    }, 200);
    scheduleSpawnRef.current(450);
  }, [clearTimers, settings]);

  const hit = useCallback((hole: number) => {
    if (phaseRef.current !== 'playing') return;
    const currentTarget = targetRef.current;
    if (!currentTarget || currentTarget.hole !== hole) {
      statsRef.current.emptyTaps += 1;
      if (comboRef.current > 0) {
        comboRef.current = 0;
        setCombo(0);
      }
      return;
    }

    if (targetTimerRef.current) clearTimeout(targetTimerRef.current);
    targetTimerRef.current = null;
    targetRef.current = null;
    setTarget(null);
    setFlash({ hole, type: currentTarget.type });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 280);

    if (currentTarget.type === 'bomb') {
      statsRef.current.bombsHit += 1;
      comboRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - BOMB_PENALTY);
      setCombo(0);
      setScore(scoreRef.current);
    } else {
      statsRef.current.molesHit += 1;
      comboRef.current += 1;
      statsRef.current.maxCombo = Math.max(statsRef.current.maxCombo, comboRef.current);
      const bonus = settingsRef.current.comboBonus ? Math.min(comboRef.current - 1, 5) : 0;
      scoreRef.current += 1 + bonus;
      setCombo(comboRef.current);
      setScore(scoreRef.current);
    }

    const pace = PACE_OPTIONS[settingsRef.current.pace];
    const nextDelay = pace.spawnMinMs * 0.65 + Math.random() * 140;
    scheduleSpawnRef.current(nextDelay);
  }, []);

  const leaveGame = useCallback(() => {
    phaseRef.current = 'setup';
    clearTimers();
    router.dismiss();
  }, [clearTimers]);

  useEffect(() => () => {
    phaseRef.current = 'setup';
    clearTimers();
  }, [clearTimers]);

  const progress = timeLeft / settingsRef.current.duration;
  const attempts = result.molesHit + result.molesMissed;
  const accuracy = attempts > 0 ? Math.round((result.molesHit / attempts) * 100) : 0;
  const boardSize = Math.min(Math.max(216, windowHeight - 300), windowWidth - Spacing.four * 2, 360);
  const holeSize = (boardSize - Spacing.two * 2) / 3;

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
            <FontAwesome name="angle-left" size={22} color={BrandColors.novaRose} />
            <ThemedText type="smallBold" style={{ color: BrandColors.novaRose }}>返回</ThemedText>
          </Pressable>
          <ThemedView style={styles.titleBlock}>
            <ThemedText type="subtitle">星穴突击</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">打地鼠 · 反应训练</ThemedText>
          </ThemedView>
          <ThemedView style={styles.topBarSpacer} />
        </ThemedView>

        {phase === 'playing' ? (
          <ThemedView style={styles.gameArea}>
            <ThemedView style={styles.hud}>
              <HudItem icon="star" label="得分" value={String(score)} color={BrandColors.solar} />
              <HudItem icon="bolt" label="连击" value={combo > 1 ? `×${combo}` : '—'} color={BrandColors.novaRose} />
              <HudItem icon="clock-o" label="剩余" value={`${timeLeft}s`} color={BrandColors.cometBlue} />
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.progressTrack}>
              <ThemedView
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(0, progress) * 100}%`,
                    backgroundColor: progress <= 0.25 ? BrandColors.novaRose : BrandColors.aurora,
                  },
                ]}
              />
            </ThemedView>

            <ThemedView style={[styles.grid, { width: boardSize }]}>
              {Array.from({ length: GRID_SIZE }, (_, hole) => {
                const active = target?.hole === hole;
                const isBomb = active && target.type === 'bomb';
                const activeFlash = flash?.hole === hole ? flash : null;
                return (
                  <Pressable
                    accessibilityLabel={active ? (isBomb ? '地雷，不要点击' : '地鼠，点击得分') : `空星穴 ${hole + 1}`}
                    accessibilityRole="button"
                    key={hole}
                    onPress={() => hit(hole)}
                    style={({ pressed }) => [
                      styles.holePressable,
                      { width: holeSize, height: holeSize },
                      pressed && styles.holePressed,
                    ]}
                  >
                    <ThemedView
                      type="backgroundElement"
                      style={[
                        styles.hole,
                        active && styles.holeActive,
                        isBomb && styles.holeBomb,
                        activeFlash?.type === 'mole' && styles.holeHit,
                        activeFlash?.type === 'bomb' && styles.holeExplosion,
                      ]}
                    >
                      <ThemedView style={styles.holeShadow} />
                      {active ? (
                        <ThemedText style={styles.targetEmoji}>{isBomb ? '💣' : '🐹'}</ThemedText>
                      ) : activeFlash ? (
                        <ThemedText style={styles.flashEmoji}>{activeFlash.type === 'mole' ? '+✓' : '−3'}</ThemedText>
                      ) : null}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.missionHint}>
              <ThemedText style={styles.hintEmoji}>🛰️</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                点击地鼠积累连击{settingsRef.current.bombs ? `，避开地雷（-${BOMB_PENALTY} 分）` : ''}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {phase === 'setup' ? (
              <>
                <ThemedView type="backgroundElement" style={[styles.heroCard, { borderColor: `${BrandColors.novaRose}45` }]}>
                  <ThemedView style={[styles.heroIcon, { backgroundColor: `${BrandColors.novaRose}18` }]}>
                    <ThemedText style={styles.heroEmoji}>🐹</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.heroCopy}>
                    <ThemedText type="default" style={styles.heroTitle}>捕捉跃迁中的星鼹</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.heroDescription}>
                      地鼠出现时快速点击。漏掉会中断连击，误触地雷会扣分。
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.sectionHeading}>
                  <ThemedText type="smallBold">任务参数</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">开局后参数锁定</ThemedText>
                </ThemedView>

                <ThemedView type="backgroundElement" style={styles.settingsCard}>
                  <SettingGroup title="任务时间" description="决定本局持续时长">
                    {[30, 60, 99].map((duration) => (
                      <OptionChip
                        key={duration}
                        label={`${duration} 秒`}
                        selected={settings.duration === duration}
                        onPress={() => updateSetting('duration', duration as GameSettings['duration'])}
                      />
                    ))}
                  </SettingGroup>

                  <ThemedView style={[styles.settingDivider, { backgroundColor: theme.backgroundSelected }]} />

                  <SettingGroup title="出现节奏" description={PACE_OPTIONS[settings.pace].description}>
                    {(Object.keys(PACE_OPTIONS) as PaceKey[]).map((pace) => (
                      <OptionChip
                        key={pace}
                        label={PACE_OPTIONS[pace].label}
                        selected={settings.pace === pace}
                        onPress={() => updateSetting('pace', pace)}
                      />
                    ))}
                  </SettingGroup>

                  <ThemedView style={[styles.settingDivider, { backgroundColor: theme.backgroundSelected }]} />

                  <SettingGroup title="地雷干扰" description={settings.bombs ? `约 22% 概率，误触扣 ${BOMB_PENALTY} 分` : '只出现地鼠，适合热身'}>
                    <OptionChip label="开启" selected={settings.bombs} onPress={() => updateSetting('bombs', true)} />
                    <OptionChip label="关闭" selected={!settings.bombs} onPress={() => updateSetting('bombs', false)} />
                  </SettingGroup>

                  <ThemedView style={[styles.settingDivider, { backgroundColor: theme.backgroundSelected }]} />

                  <SettingGroup title="连击加成" description={settings.comboBonus ? '连续命中可获得额外分数' : '每只地鼠固定 1 分'}>
                    <OptionChip label="开启" selected={settings.comboBonus} onPress={() => updateSetting('comboBonus', true)} />
                    <OptionChip label="关闭" selected={!settings.comboBonus} onPress={() => updateSetting('comboBonus', false)} />
                  </SettingGroup>
                </ThemedView>
              </>
            ) : (
              <>
                <ThemedView type="backgroundElement" style={[styles.resultCard, { borderColor: `${BrandColors.solar}45` }]}>
                  <ThemedText style={styles.resultTrophy}>🏆</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">任务完成</ThemedText>
                  <ThemedText style={styles.finalScore}>{score} 分</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {settingsRef.current.duration} 秒 · {PACE_OPTIONS[settingsRef.current.pace].label}节奏
                    {settingsRef.current.bombs ? ' · 含地雷' : ' · 无地雷'}
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.resultGrid}>
                  <ResultItem emoji="🐹" value={result.molesHit} label="命中" />
                  <ResultItem emoji="🕳️" value={result.molesMissed} label="漏掉" />
                  <ResultItem emoji="🎯" value={`${accuracy}%`} label="命中率" />
                  <ResultItem emoji="⚡" value={`×${result.maxCombo}`} label="最高连击" />
                  <ResultItem emoji="💣" value={result.bombsHit} label="误触地雷" />
                  <ResultItem emoji="👆" value={result.emptyTaps} label="空点" />
                </ThemedView>

                {bestRecord.games > 0 ? (
                  <ThemedView type="backgroundElement" style={styles.bestRecord}>
                    <FontAwesome name="trophy" size={16} color={BrandColors.solar} />
                    <ThemedText type="small" themeColor="textSecondary">
                      历史最高 {Math.max(bestRecord.best, score)} 分 · 共 {bestRecord.games} 局
                    </ThemedText>
                  </ThemedView>
                ) : null}
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={startGame}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <FontAwesome name={phase === 'finished' ? 'refresh' : 'play'} size={18} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>{phase === 'finished' ? '按当前参数再来一局' : '开始任务'}</ThemedText>
            </Pressable>

            {phase === 'finished' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  phaseRef.current = 'setup';
                  setPhase('setup');
                }}
                style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}
              >
                <FontAwesome name="sliders" size={16} color={theme.primary} />
                <ThemedText type="smallBold" style={{ color: theme.primary }}>调整任务参数</ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function SettingGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView style={styles.settingGroup}>
      <ThemedView style={styles.settingCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{description}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.optionRow}>{children}</ThemedView>
    </ThemedView>
  );
}

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionChip,
        { borderColor: selected ? BrandColors.cometBlue : theme.backgroundSelected },
        selected && styles.optionChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="smallBold" style={selected ? styles.optionChipTextSelected : undefined}>{label}</ThemedText>
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

function ResultItem({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.resultItem}>
      <ThemedText style={styles.resultEmoji}>{emoji}</ThemedText>
      <ThemedText style={styles.resultValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: 560, paddingHorizontal: Spacing.four },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  topBar: {
    minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { width: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  titleBlock: { alignItems: 'center', gap: 1 },
  topBarSpacer: { width: 72 },
  scrollContent: { paddingTop: Spacing.two, paddingBottom: Spacing.five, gap: Spacing.three },
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    borderRadius: 22, padding: Spacing.four, borderWidth: 1,
  },
  heroIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 42, lineHeight: 50 },
  heroCopy: { flex: 1, gap: Spacing.one },
  heroTitle: { fontWeight: '700' },
  heroDescription: { lineHeight: 19 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.one },
  settingsCard: { borderRadius: 22, paddingHorizontal: Spacing.three },
  settingGroup: {
    minHeight: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  settingCopy: { flex: 1, gap: 3 },
  settingDivider: { height: StyleSheet.hairlineWidth },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  optionChip: {
    minWidth: 54, height: 36, paddingHorizontal: 10, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  optionChipSelected: { backgroundColor: BrandColors.cometBlue, borderColor: BrandColors.cometBlue },
  optionChipTextSelected: { color: BrandColors.deepSpace },
  primaryButton: {
    minHeight: 54, borderRadius: 18, backgroundColor: BrandColors.novaRose,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 48, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
  },
  gameArea: { flex: 1, paddingTop: Spacing.two, gap: Spacing.three },
  hud: { flexDirection: 'row', gap: Spacing.two },
  hudItem: {
    flex: 1, minWidth: 0, minHeight: 60, borderRadius: 16, paddingHorizontal: Spacing.two,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
  },
  hudCopy: { gap: 1 },
  hudValue: { fontSize: 18, lineHeight: 22, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    gap: Spacing.two, paddingVertical: Spacing.one, alignSelf: 'center',
  },
  holePressable: {},
  holePressed: { transform: [{ scale: 0.96 }] },
  hole: {
    flex: 1, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  holeActive: { borderColor: BrandColors.cometBlue, backgroundColor: `${BrandColors.cometBlue}16` },
  holeBomb: { borderColor: BrandColors.novaRose, backgroundColor: `${BrandColors.novaRose}16` },
  holeHit: { borderColor: BrandColors.aurora, backgroundColor: `${BrandColors.aurora}28` },
  holeExplosion: { borderColor: BrandColors.novaRose, backgroundColor: `${BrandColors.novaRose}30` },
  holeShadow: {
    position: 'absolute', bottom: 10, width: '58%', height: 18, borderRadius: 12,
    backgroundColor: `${BrandColors.deepSpace}35`, transform: [{ scaleX: 1.15 }],
  },
  targetEmoji: { fontSize: 48, lineHeight: 58, marginBottom: 8 },
  flashEmoji: { fontSize: 22, lineHeight: 28, fontWeight: '900', color: BrandColors.aurora, marginBottom: 8 },
  missionHint: {
    minHeight: 52, borderRadius: 16, paddingHorizontal: Spacing.three,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
  },
  hintEmoji: { fontSize: 20, lineHeight: 26 },
  hintText: { flex: 1, lineHeight: 18 },
  resultCard: { borderRadius: 22, padding: Spacing.four, alignItems: 'center', gap: Spacing.one, borderWidth: 1 },
  resultTrophy: { fontSize: 48, lineHeight: 58 },
  finalScore: { fontSize: 42, lineHeight: 50, fontWeight: '900', color: BrandColors.solar },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  resultItem: { width: '48%', flexGrow: 1, borderRadius: 18, padding: Spacing.three, alignItems: 'center', gap: 2 },
  resultEmoji: { fontSize: 24, lineHeight: 30 },
  resultValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  bestRecord: {
    minHeight: 48, borderRadius: 16, paddingHorizontal: Spacing.three,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
  },
});
