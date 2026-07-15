import type { ReactNode } from 'react';
import type { VideoSource } from 'expo-video';

/**
 * A portable palette for the global player. Supplying a partial palette lets
 * another app reuse this module without depending on its own theme context.
 */
export type VideoPlayerTheme = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  track: string;
  danger: string;
};

export type VideoPlayerLaunchOptions = {
  source: VideoSource;
  title?: string;
  /** Starts playback after the source is ready. Defaults to true. */
  autoPlay?: boolean;
};

export type VideoPlayerMode = 'idle' | 'window' | 'fullscreen' | 'mini';
export type FullscreenOrientation = 'portrait' | 'landscape';

export type VideoPlayerProviderProps = {
  children: ReactNode;
  theme?: Partial<VideoPlayerTheme>;
  /**
   * Orientation to restore after the fullscreen layer closes. Leave as
   * `default` for apps that normally allow rotation.
   */
  returnOrientation?: FullscreenOrientation | 'default';
};

export type VideoPlayerController = {
  active: boolean;
  mode: VideoPlayerMode;
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  open: (options: VideoPlayerLaunchOptions) => void;
  close: () => void;
  minimize: () => void;
  expand: () => void;
  togglePlayback: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
};
