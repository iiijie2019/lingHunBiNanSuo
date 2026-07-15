import { FontAwesome } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { defaultVideoPlayerTheme } from './theme';
import type {
  FullscreenOrientation,
  VideoPlayerController,
  VideoPlayerLaunchOptions,
  VideoPlayerMode,
  VideoPlayerProviderProps,
  VideoPlayerTheme,
} from './types';

type VideoPlayerInstance = NonNullable<ComponentProps<typeof VideoView>['player']>;
type IconName = ComponentProps<typeof FontAwesome>['name'];

type PlaybackSnapshot = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
};

type VideoSession = VideoPlayerLaunchOptions & {
  id: string;
  title: string;
};

const VideoPlayerContext = createContext<VideoPlayerController | undefined>(undefined);

type VideoPlayerSurfaceContextValue = {
  player: VideoPlayerInstance;
  palette: VideoPlayerTheme;
  session: VideoSession | null;
  mode: VideoPlayerMode;
  orientation: FullscreenOrientation;
  playback: PlaybackSnapshot;
  error: string | null;
  close: () => void;
  minimize: () => void;
  expand: () => void;
  restoreWindow: () => void;
  selectOrientation: (orientation: FullscreenOrientation) => void;
  togglePlayback: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  setWindowHostFocused: (isFocused: boolean) => void;
  minimizeWindowIfInactive: () => void;
};

const VideoPlayerSurfaceContext = createContext<VideoPlayerSurfaceContextValue | undefined>(undefined);

const emptyPlayback: PlaybackSnapshot = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
};

function finiteTime(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, lower: number, upper: number) {
  return Math.min(Math.max(value, lower), upper);
}

function formatTime(seconds: number) {
  const totalSeconds = Math.floor(finiteTime(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function withOpacity(color: string, opacity: number) {
  const normalized = color.trim();
  const hex = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (!hex) {
    return color;
  }

  const fullHex = hex.length === 3
    ? hex.split('').map(character => `${character}${character}`).join('')
    : hex;
  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

/**
 * A root-level, route-independent player. It intentionally renders only one
 * VideoView at a time: Android cannot attach one expo-video player to multiple
 * native views concurrently.
 */
export function VideoPlayerProvider({
  children,
  theme,
  returnOrientation = 'default',
}: VideoPlayerProviderProps) {
  const palette = useMemo<VideoPlayerTheme>(
    () => ({ ...defaultVideoPlayerTheme, ...theme }),
    [theme],
  );
  const player = useVideoPlayer(null, createdPlayer => {
    createdPlayer.loop = false;
    createdPlayer.timeUpdateEventInterval = 0.25;
  });
  const [session, setSession] = useState<VideoSession | null>(null);
  const [mode, setMode] = useState<VideoPlayerMode>('idle');
  const [playback, setPlayback] = useState<PlaybackSnapshot>(emptyPlayback);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<FullscreenOrientation>('portrait');
  const sessionIdRef = useRef<string | null>(null);
  const orientationRequestRef = useRef(0);
  const modeRef = useRef<VideoPlayerMode>('idle');
  const windowHostFocusedRef = useRef(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const restorePreferredOrientation = useCallback(async () => {
    orientationRequestRef.current += 1;
    try {
      if (returnOrientation === 'default') {
        await ScreenOrientation.unlockAsync();
      } else {
        await ScreenOrientation.lockAsync(
          returnOrientation === 'landscape'
            ? ScreenOrientation.OrientationLock.LANDSCAPE
            : ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      }
    } catch {
      // Web browsers and a few device policies may reject an orientation lock.
      // The player still remains usable with its responsive layout.
    }
  }, [returnOrientation]);

  const lockFullscreenOrientation = useCallback(async (nextOrientation: FullscreenOrientation) => {
    const requestId = orientationRequestRef.current + 1;
    orientationRequestRef.current = requestId;
    const orientationLock = nextOrientation === 'landscape'
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.PORTRAIT_UP;

    try {
      await ScreenOrientation.lockAsync(orientationLock);
      // If the user has already minimized or closed the player while the
      // native lock was resolving, immediately restore the host app's chosen
      // orientation instead of leaving it in a stale fullscreen lock.
      if (requestId !== orientationRequestRef.current) {
        await restorePreferredOrientation();
      }
    } catch {
      // Keep the selected UI state; device rotation is an enhancement, not a
      // requirement for displaying the fullscreen video controls.
    }
  }, [restorePreferredOrientation]);

  const syncPlayback = useCallback(() => {
    const next: PlaybackSnapshot = {
      currentTime: finiteTime(player.currentTime),
      duration: finiteTime(player.duration),
      isPlaying: player.playing,
    };

    setPlayback(previous => {
      const unchanged = previous.isPlaying === next.isPlaying
        && Math.abs(previous.currentTime - next.currentTime) < 0.08
        && Math.abs(previous.duration - next.duration) < 0.08;
      return unchanged ? previous : next;
    });
  }, [player]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!sessionIdRef.current) {
      return;
    }
    setPlayback(previous => ({ ...previous, currentTime: finiteTime(currentTime) }));
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!sessionIdRef.current) {
      return;
    }
    setPlayback(previous => ({ ...previous, isPlaying }));
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    if (!sessionIdRef.current) {
      return;
    }
    setPlayback(previous => ({ ...previous, duration: finiteTime(duration) }));
  });

  useEventListener(player, 'statusChange', ({ status, error: playerError }) => {
    if (!sessionIdRef.current) {
      return;
    }
    if (status === 'error') {
      setError(playerError?.message || '视频暂时无法播放，请稍后重试。');
    } else if (status === 'readyToPlay') {
      setError(null);
    }
  });

  useEffect(() => () => {
    player.pause();
    void restorePreferredOrientation();
  }, [player, restorePreferredOrientation]);

  useEffect(() => {
    // Keep normal routes upright without a navigator-wide orientation lock.
    // Fullscreen playback can then safely override it.
    void restorePreferredOrientation();
  }, [restorePreferredOrientation]);

  const open = useCallback((options: VideoPlayerLaunchOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextSession: VideoSession = {
      ...options,
      id,
      title: options.title?.trim() || '正在播放',
    };

    sessionIdRef.current = id;
    setSession(nextSession);
    setMode('window');
    setOrientation('portrait');
    setPlayback(emptyPlayback);
    setError(null);
    player.pause();
    void restorePreferredOrientation();

    void player.replaceAsync(options.source)
      .then(() => {
        if (sessionIdRef.current === id && options.autoPlay !== false) {
          player.play();
          syncPlayback();
        }
      })
      .catch(() => {
        if (sessionIdRef.current === id) {
          setError('视频暂时无法加载，请检查网络后重试。');
        }
      });
  }, [player, restorePreferredOrientation, syncPlayback]);

  const close = useCallback(() => {
    sessionIdRef.current = null;
    player.pause();
    player.replace(null);
    setSession(null);
    setMode('idle');
    setPlayback(emptyPlayback);
    setError(null);
    void restorePreferredOrientation();
  }, [player, restorePreferredOrientation]);

  const minimize = useCallback(() => {
    if (!session) {
      return;
    }
    setMode('mini');
    void restorePreferredOrientation();
  }, [restorePreferredOrientation, session]);

  const expand = useCallback(() => {
    if (!session) {
      return;
    }
    setMode('fullscreen');
  }, [session]);

  const restoreWindow = useCallback(() => {
    if (!session) {
      return;
    }
    setMode(windowHostFocusedRef.current ? 'window' : 'mini');
    void restorePreferredOrientation();
  }, [restorePreferredOrientation, session]);

  const setWindowHostFocused = useCallback((isFocused: boolean) => {
    windowHostFocusedRef.current = isFocused;
  }, []);

  const minimizeWindowIfInactive = useCallback(() => {
    if (modeRef.current !== 'window' || !sessionIdRef.current) {
      return;
    }
    setMode('mini');
    void restorePreferredOrientation();
  }, [restorePreferredOrientation]);

  const selectOrientation = useCallback((nextOrientation: FullscreenOrientation) => {
    setOrientation(nextOrientation);
    if (mode === 'fullscreen') {
      void lockFullscreenOrientation(nextOrientation);
    }
  }, [lockFullscreenOrientation, mode]);

  const togglePlayback = useCallback(() => {
    if (!session) {
      return;
    }
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    syncPlayback();
  }, [player, session, syncPlayback]);

  const seekTo = useCallback((seconds: number) => {
    if (!session) {
      return;
    }
    const duration = finiteTime(player.duration);
    player.currentTime = clamp(finiteTime(seconds), 0, duration || finiteTime(seconds));
    syncPlayback();
  }, [player, session, syncPlayback]);

  const seekBy = useCallback((seconds: number) => {
    seekTo(finiteTime(player.currentTime) + seconds);
  }, [player, seekTo]);

  const controller = useMemo<VideoPlayerController>(() => ({
    active: session !== null,
    mode,
    title: session?.title ?? '',
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
    duration: playback.duration,
    error,
    open,
    close,
    minimize,
    expand,
    togglePlayback,
    seekBy,
    seekTo,
  }), [
    close,
    error,
    expand,
    minimize,
    mode,
    open,
    playback.currentTime,
    playback.duration,
    playback.isPlaying,
    seekBy,
    seekTo,
    session,
    togglePlayback,
  ]);

  const surfaceContext = useMemo<VideoPlayerSurfaceContextValue>(() => ({
    player,
    palette,
    session,
    mode,
    orientation,
    playback,
    error,
    close,
    minimize,
    expand,
    restoreWindow,
    selectOrientation,
    togglePlayback,
    seekBy,
    seekTo,
    setWindowHostFocused,
    minimizeWindowIfInactive,
  }), [
    close,
    error,
    expand,
    minimize,
    minimizeWindowIfInactive,
    mode,
    orientation,
    palette,
    playback,
    player,
    restoreWindow,
    seekBy,
    seekTo,
    selectOrientation,
    session,
    setWindowHostFocused,
    togglePlayback,
  ]);

  return (
    <VideoPlayerContext.Provider value={controller}>
      <VideoPlayerSurfaceContext.Provider value={surfaceContext}>
        {children}
        {session && mode === 'fullscreen' ? (
          <FullscreenVideoPlayer
            error={error}
            isPlaying={playback.isPlaying}
            orientation={orientation}
            palette={palette}
            player={player}
            title={session.title}
            value={playback.currentTime}
            duration={playback.duration}
            onClose={close}
            onMinimize={minimize}
            onOrientationChange={selectOrientation}
            onPresented={() => {
              void lockFullscreenOrientation(orientation);
            }}
            onRestoreWindow={restoreWindow}
            onSeekBy={seekBy}
            onSeekTo={seekTo}
            onTogglePlayback={togglePlayback}
          />
        ) : null}
        {session && mode === 'mini' ? (
          <FloatingVideoPlayer
            isPlaying={playback.isPlaying}
            palette={palette}
            player={player}
            onClose={close}
            onExpand={expand}
            onTogglePlayback={togglePlayback}
          />
        ) : null}
      </VideoPlayerSurfaceContext.Provider>
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayerOverlay() {
  const controller = useContext(VideoPlayerContext);
  if (!controller) {
    throw new Error('useVideoPlayerOverlay must be used within a VideoPlayerProvider.');
  }
  return controller;
}

type FullscreenVideoPlayerProps = {
  player: VideoPlayerInstance;
  palette: VideoPlayerTheme;
  title: string;
  value: number;
  duration: number;
  isPlaying: boolean;
  error: string | null;
  orientation: FullscreenOrientation;
  onClose: () => void;
  onMinimize: () => void;
  onPresented: () => void;
  onRestoreWindow: () => void;
  onOrientationChange: (orientation: FullscreenOrientation) => void;
  onTogglePlayback: () => void;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (seconds: number) => void;
};

/**
 * Place this in the normal page that starts playback. It owns the single
 * non-fullscreen VideoView, while the provider owns fullscreen and mini modes.
 */
export function VideoPlayerWindow() {
  const surface = useContext(VideoPlayerSurfaceContext);
  const isFocused = useIsFocused();

  if (!surface) {
    throw new Error('VideoPlayerWindow must be used within a VideoPlayerProvider.');
  }

  const {
    close,
    error,
    expand,
    minimize,
    minimizeWindowIfInactive,
    mode,
    orientation,
    palette,
    playback,
    player,
    seekBy,
    seekTo,
    selectOrientation,
    session,
    setWindowHostFocused,
    togglePlayback,
  } = surface;

  useEffect(() => {
    if (isFocused) {
      setWindowHostFocused(true);
    } else {
      minimizeWindowIfInactive();
    }
    return () => {
      if (isFocused) {
        setWindowHostFocused(false);
        minimizeWindowIfInactive();
      }
    };
  }, [isFocused, minimizeWindowIfInactive, setWindowHostFocused]);

  if (!isFocused || !session || mode !== 'window') {
    return null;
  }

  return (
    <View style={[styles.windowPlayer, { borderColor: palette.surfaceRaised, backgroundColor: palette.background }]}>
      <VideoPlaybackSurface
        error={error}
        isPlaying={playback.isPlaying}
        mode="window"
        orientation={orientation}
        palette={palette}
        player={player}
        title={session.title}
        value={playback.currentTime}
        duration={playback.duration}
        onClose={close}
        onExpand={expand}
        onMinimize={minimize}
        onOrientationChange={selectOrientation}
        onSeekBy={seekBy}
        onSeekTo={seekTo}
        onTogglePlayback={togglePlayback}
      />
    </View>
  );
}

function FullscreenVideoPlayer({
  player,
  palette,
  title,
  value,
  duration,
  isPlaying,
  error,
  orientation,
  onClose,
  onMinimize,
  onPresented,
  onRestoreWindow,
  onOrientationChange,
  onTogglePlayback,
  onSeekBy,
  onSeekTo,
}: FullscreenVideoPlayerProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onRestoreWindow}
      onShow={onPresented}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      <SafeAreaProvider>
        <View style={[styles.fullscreenRoot, { backgroundColor: palette.background }]}>
          <StatusBar backgroundColor={palette.background} style="light" translucent />
          <VideoPlaybackSurface
            error={error}
            isPlaying={isPlaying}
            mode="fullscreen"
            orientation={orientation}
            palette={palette}
            player={player}
            title={title}
            value={value}
            duration={duration}
            onClose={onClose}
            onExpand={() => {}}
            onMinimize={onMinimize}
            onOrientationChange={onOrientationChange}
            onRestoreWindow={onRestoreWindow}
            onSeekBy={onSeekBy}
            onSeekTo={onSeekTo}
            onTogglePlayback={onTogglePlayback}
          />
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

type VideoPlaybackSurfaceProps = {
  player: VideoPlayerInstance;
  palette: VideoPlayerTheme;
  title: string;
  value: number;
  duration: number;
  isPlaying: boolean;
  error: string | null;
  orientation: FullscreenOrientation;
  mode: 'window' | 'fullscreen';
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onRestoreWindow?: () => void;
  onOrientationChange: (orientation: FullscreenOrientation) => void;
  onTogglePlayback: () => void;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (seconds: number) => void;
};

function VideoPlaybackSurface({
  player,
  palette,
  title,
  value,
  duration,
  isPlaying,
  error,
  orientation,
  mode,
  onClose,
  onMinimize,
  onExpand,
  onRestoreWindow,
  onOrientationChange,
  onTogglePlayback,
  onSeekBy,
  onSeekTo,
}: VideoPlaybackSurfaceProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactFullscreen = mode === 'fullscreen' && (height < 560 || width > height);
  const { controlsVisible, controlsOpacity, revealControls } = useAutoHideControls(isPlaying, error);
  const isFullscreen = mode === 'fullscreen';
  const fullscreenHeaderInsets = isFullscreen
    ? {
      paddingTop: Math.max(insets.top + 8, 18),
      paddingRight: Math.max(insets.right + 16, 16),
      paddingLeft: Math.max(insets.left + 16, 16),
    }
    : undefined;
  const fullscreenPanelInsets = isFullscreen
    ? { paddingBottom: Math.max(insets.bottom + 10, 14) }
    : undefined;
  const handleSeekBy = (seconds: number) => {
    revealControls();
    onSeekBy(seconds);
  };
  const handleTogglePlayback = () => {
    revealControls();
    onTogglePlayback();
  };

  const content = (
    <View
      style={[
        styles.videoSurface,
        isFullscreen ? styles.fullscreenVideoSurface : styles.windowVideoSurface,
        { backgroundColor: palette.background },
      ]}
    >
      <VideoView
        contentFit="contain"
        nativeControls={false}
        player={player}
        playsInline
        style={StyleSheet.absoluteFill}
        surfaceType="textureView"
      />
      <Pressable
        accessibilityLabel="显示视频控制面板"
        accessibilityRole="button"
        onPress={revealControls}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}
      >
        <View pointerEvents="none" style={styles.videoShade} />
        <View
          pointerEvents="box-none"
          style={[
            styles.surfaceHeader,
            isFullscreen ? styles.fullscreenHeader : styles.windowHeader,
            fullscreenHeaderInsets,
          ]}
        >
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={[styles.fullscreenTitle, { color: palette.text }]}>{title}</Text>
            {isFullscreen ? (
              <Text style={[styles.fullscreenSubtitle, { color: palette.textMuted }]}>全屏播放 · 可选竖屏或横屏</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            {isFullscreen && onRestoreWindow ? (
              <IconButton
                icon="compress"
                label="退出全屏播放"
                onPress={onRestoreWindow}
                palette={palette}
                small
              />
            ) : null}
            <IconButton
              icon="minus"
              label="切换为小窗播放"
              onPress={onMinimize}
              palette={palette}
              small
            />
            {!isFullscreen ? (
              <IconButton
                icon="expand"
                label="全屏播放"
                onPress={onExpand}
                palette={palette}
                small
              />
            ) : null}
            <IconButton
              icon="times"
              label="关闭视频"
              onPress={onClose}
              palette={palette}
              small
              tone="danger"
            />
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.centerPlaybackControls}>
          <OverlaySeekButton
            icon="undo"
            label="快退 10 秒"
            text="-10"
            palette={palette}
            onPress={() => handleSeekBy(-10)}
          />
          <Pressable
            accessibilityLabel={isPlaying ? '暂停播放' : '继续播放'}
            accessibilityRole="button"
            onPress={handleTogglePlayback}
            style={({ pressed }) => [
              styles.centerPlayButton,
              {
                backgroundColor: withOpacity(palette.accent, 0.9),
                borderColor: withOpacity(palette.text, 0.2),
              },
              pressed && styles.controlPressed,
            ]}
          >
            <FontAwesome color={palette.background} name={isPlaying ? 'pause' : 'play'} size={24} />
          </Pressable>
          <OverlaySeekButton
            icon="repeat"
            label="快进 10 秒"
            text="+10"
            palette={palette}
            onPress={() => handleSeekBy(10)}
          />
        </View>

        <View
          pointerEvents="box-none"
          style={[
            styles.videoControlPanel,
            !isFullscreen && styles.windowControlPanel,
            {
              backgroundColor: withOpacity(palette.background, 0.84),
              borderColor: withOpacity(palette.surfaceRaised, 0.76),
            },
            fullscreenPanelInsets,
          ]}
        >
          <ProgressTrack
            duration={duration}
            palette={palette}
            value={value}
            onInteraction={revealControls}
            onSeek={onSeekTo}
          />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: palette.textMuted }]}>{formatTime(value)}</Text>
            <Text style={[styles.timeText, { color: palette.textMuted }]}>{formatTime(duration)}</Text>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
          ) : null}

          {isFullscreen ? (
            <View style={[styles.orientationRow, compactFullscreen && styles.compactOrientationRow]}>
              <Text style={[styles.orientationHint, { color: palette.textMuted }]}>播放方向</Text>
              <View
                style={[
                  styles.orientationSelector,
                  {
                    backgroundColor: withOpacity(palette.surface, 0.84),
                    borderColor: withOpacity(palette.text, 0.1),
                  },
                ]}
              >
                <OrientationButton
                  active={orientation === 'portrait'}
                  icon="mobile"
                  label="竖屏"
                  onPress={() => {
                    revealControls();
                    onOrientationChange('portrait');
                  }}
                  palette={palette}
                />
                <OrientationButton
                  active={orientation === 'landscape'}
                  icon="desktop"
                  label="横屏"
                  onPress={() => {
                    revealControls();
                    onOrientationChange('landscape');
                  }}
                  palette={palette}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );

  return content;
}

function useAutoHideControls(isPlaying: boolean, error: string | null) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideControls = useCallback(() => {
    if (!isPlaying || error) {
      return;
    }
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 360,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setControlsVisible(false);
      }
    });
  }, [controlsOpacity, error, isPlaying]);

  const revealControls = useCallback(() => {
    clearHideTimer();
    controlsOpacity.stopAnimation();
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    if (isPlaying && !error) {
      hideTimerRef.current = setTimeout(hideControls, 1000);
    }
  }, [clearHideTimer, controlsOpacity, error, hideControls, isPlaying]);

  useEffect(() => {
    clearHideTimer();
    controlsOpacity.stopAnimation();

    if (!isPlaying || error) {
      controlsOpacity.setValue(1);
      setControlsVisible(true);
      return undefined;
    }

    // A fresh playback cycle always begins with visible controls, then gives
    // the video room after one second. This also handles autoplay reliably.
    controlsOpacity.setValue(1);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(hideControls, 1000);
    return clearHideTimer;
  }, [clearHideTimer, controlsOpacity, error, hideControls, isPlaying]);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  return { controlsVisible, controlsOpacity, revealControls };
}

type FloatingVideoPlayerProps = {
  player: VideoPlayerInstance;
  palette: VideoPlayerTheme;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onClose: () => void;
  onExpand: () => void;
};

function FloatingVideoPlayer({
  player,
  palette,
  isPlaying,
  onTogglePlayback,
  onClose,
  onExpand,
}: FloatingVideoPlayerProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const miniWidth = clamp(windowWidth * 0.58, 176, 236);
  const miniHeight = miniWidth * (9 / 16);
  const sideMargin = 16;
  const topLimit = Math.max(16, insets.top + 8);
  const maxX = Math.max(sideMargin, windowWidth - miniWidth - sideMargin);
  // Keep the window above the tab bar on tabbed routes while still allowing
  // it to be pulled near the bottom on detail pages.
  const maxY = Math.max(topLimit, windowHeight - miniHeight - insets.bottom - 92);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const positionRef = useRef({ x: maxX, y: maxY });
  const hasInitialPosition = useRef(false);
  const dragStartRef = useRef(positionRef.current);
  const draggingRef = useRef(false);
  const lastDragEndRef = useRef(0);

  const setPosition = useCallback((nextPosition: { x: number; y: number }) => {
    positionRef.current = nextPosition;
    position.setValue(nextPosition);
  }, [position]);

  const clampPosition = useCallback((nextPosition: { x: number; y: number }) => ({
    x: clamp(nextPosition.x, sideMargin, maxX),
    y: clamp(nextPosition.y, topLimit, maxY),
  }), [maxX, maxY, topLimit]);

  useEffect(() => {
    const defaultPosition = { x: maxX, y: maxY };
    const nextPosition = hasInitialPosition.current
      ? clampPosition(positionRef.current)
      : defaultPosition;
    hasInitialPosition.current = true;
    setPosition(nextPosition);
  }, [clampPosition, maxX, maxY, setPosition]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      draggingRef.current = true;
      dragStartRef.current = positionRef.current;
    },
    onPanResponderMove: (_event, gesture) => {
      setPosition(clampPosition({
        x: dragStartRef.current.x + gesture.dx,
        y: dragStartRef.current.y + gesture.dy,
      }));
    },
    onPanResponderRelease: () => {
      draggingRef.current = false;
      lastDragEndRef.current = Date.now();
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false;
      lastDragEndRef.current = Date.now();
    },
  }), [clampPosition, setPosition]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floatingWindow,
        {
          width: miniWidth,
          height: miniHeight,
          borderColor: palette.surfaceRaised,
          backgroundColor: palette.background,
          transform: position.getTranslateTransform(),
        },
      ]}
    >
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        playsInline
        style={StyleSheet.absoluteFill}
        surfaceType="textureView"
      />
      <Pressable
        accessibilityLabel="打开全屏播放器"
        accessibilityRole="button"
        onPress={() => {
          if (!draggingRef.current && Date.now() - lastDragEndRef.current > 120) {
            onExpand();
          }
        }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="box-none" style={styles.floatingControls}>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          label={isPlaying ? '暂停播放' : '继续播放'}
          onPress={onTogglePlayback}
          palette={palette}
          small
        />
        <IconButton
          icon="times"
          label="关闭小窗播放"
          onPress={onClose}
          palette={palette}
          small
          tone="danger"
        />
        <IconButton
          icon="expand"
          label="全屏播放"
          onPress={onExpand}
          palette={palette}
          small
        />
      </View>
    </Animated.View>
  );
}

type ProgressTrackProps = {
  value: number;
  duration: number;
  palette: VideoPlayerTheme;
  onInteraction: () => void;
  onSeek: (seconds: number) => void;
};

function ProgressTrack({ value, duration, palette, onInteraction, onSeek }: ProgressTrackProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const percentage = duration > 0 ? clamp((value / duration) * 100, 0, 100) : 0;
  const seekFromPosition = useCallback((x: number) => {
    if (trackWidth <= 0 || duration <= 0) {
      return;
    }
    onSeek(clamp(x / trackWidth, 0, 1) * duration);
  }, [duration, onSeek, trackWidth]);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      onInteraction();
      seekFromPosition(event.nativeEvent.locationX);
    },
    onPanResponderMove: event => {
      onInteraction();
      seekFromPosition(event.nativeEvent.locationX);
    },
    onPanResponderRelease: event => {
      onInteraction();
      seekFromPosition(event.nativeEvent.locationX);
    },
    onPanResponderTerminate: onInteraction,
  }), [onInteraction, seekFromPosition]);

  return (
    <View
      {...panResponder.panHandlers}
      accessibilityHint="点击或拖动以调整播放进度"
      accessibilityLabel="视频播放进度"
      accessibilityRole="adjustable"
      onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
      style={styles.progressTouchTarget}
    >
      <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
        <View style={[styles.progressFill, { backgroundColor: palette.accent, width: `${percentage}%` }]} />
        <View
          style={[
            styles.progressKnob,
            { backgroundColor: palette.text, left: `${percentage}%` },
          ]}
        />
      </View>
    </View>
  );
}

type IconButtonProps = {
  icon: IconName;
  label: string;
  palette: VideoPlayerTheme;
  onPress: () => void;
  small?: boolean;
  tone?: 'default' | 'danger';
};

function IconButton({ icon, label, palette, onPress, small = false, tone = 'default' }: IconButtonProps) {
  const iconColor = tone === 'danger' ? palette.danger : palette.text;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        small && styles.iconButtonSmall,
        {
          backgroundColor: withOpacity(palette.surface, 0.84),
          borderColor: withOpacity(palette.text, 0.12),
        },
        pressed && styles.controlPressed,
      ]}
      hitSlop={6}
    >
      <FontAwesome color={iconColor} name={icon} size={small ? 15 : 18} />
    </Pressable>
  );
}

type OverlaySeekButtonProps = {
  icon: IconName;
  label: string;
  text: string;
  palette: VideoPlayerTheme;
  onPress: () => void;
};

function OverlaySeekButton({ icon, label, text, palette, onPress }: OverlaySeekButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.centerSeekButton,
        {
          backgroundColor: withOpacity(palette.surface, 0.84),
          borderColor: withOpacity(palette.text, 0.12),
        },
        pressed && styles.controlPressed,
      ]}
    >
      <FontAwesome color={palette.text} name={icon} size={16} />
      <Text style={[styles.centerSeekLabel, { color: palette.text }]}>{text}</Text>
    </Pressable>
  );
}

type OrientationButtonProps = {
  active: boolean;
  icon: IconName;
  label: string;
  palette: VideoPlayerTheme;
  onPress: () => void;
};

function OrientationButton({ active, icon, label, palette, onPress }: OrientationButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`切换为${label}播放`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.orientationButton,
        active && { backgroundColor: withOpacity(palette.accent, 0.9) },
        pressed && styles.controlPressed,
      ]}
    >
      <FontAwesome color={active ? palette.background : palette.textMuted} name={icon} size={14} />
      <Text style={[styles.orientationButtonText, { color: active ? palette.background : palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullscreenRoot: { flex: 1 },
  windowPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  videoSurface: { flex: 1, overflow: 'hidden', position: 'relative' },
  fullscreenVideoSurface: { borderRadius: 0 },
  windowVideoSurface: { borderRadius: 21 },
  videoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  surfaceHeader: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fullscreenHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  windowHeader: { paddingHorizontal: 10, paddingTop: 10 },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  fullscreenTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  fullscreenSubtitle: { fontSize: 11, lineHeight: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  centerPlaybackControls: {
    position: 'absolute',
    top: '50%',
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: -32,
  },
  centerSeekButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  centerSeekLabel: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  centerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  videoControlPanel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  windowControlPanel: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    gap: 2,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  progressTouchTarget: { justifyContent: 'center', height: 28 },
  progressTrack: { height: 4, borderRadius: 99, overflow: 'visible' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressKnob: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 11, fontVariant: ['tabular-nums'] },
  errorText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  orientationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 3,
  },
  compactOrientationRow: { paddingTop: 0 },
  orientationHint: { fontSize: 11, fontWeight: '600' },
  orientationSelector: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  orientationButton: {
    minWidth: 72,
    minHeight: 34,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  orientationButtonText: { fontSize: 12, fontWeight: '700' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSmall: { width: 38, height: 38, borderRadius: 13 },
  controlPressed: { opacity: 0.76, transform: [{ scale: 0.94 }] },
  floatingWindow: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.36,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 1000,
  },
  floatingControls: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    flexDirection: 'row',
    gap: 5,
  },
});
