# 全局视频播放器模块

这个目录可以整体复制到其他 Expo SDK 55 项目中使用。它只依赖：

- `expo-video`
- `expo-screen-orientation`
- `@expo/vector-icons`
- `react-native-safe-area-context`

在应用根部挂载 Provider。传入 `theme` 可对接任意项目的颜色；不传时使用夜航的深空深色默认值。

```tsx
import { VideoPlayerProvider } from '@/plugins/video-player';

export function AppRoot() {
  return (
    <VideoPlayerProvider returnOrientation="portrait">
      <AppNavigator />
    </VideoPlayerProvider>
  );
}
```

每个会调用 `open()` 且需要显示普通播放窗口的页面，都必须渲染一个 `VideoPlayerWindow`；再在同一页启动视频：

```tsx
import { VideoPlayerWindow, useVideoPlayerOverlay } from '@/plugins/video-player';

function ArticleScreen() {
  const video = useVideoPlayerOverlay();

  return (
    <View>
      <VideoPlayerWindow />
      <Button
        title="播放"
        onPress={() => video.open({
          source: 'https://example.com/video.mp4',
          title: '课程预览',
        })}
      />
    </View>
  );
}
```

`open()` 默认进入当前页面的普通 16:9 播放窗口，不会自动全屏；用户点窗口右上角的全屏按钮后才进入全屏。普通窗口播放时，暂停、快退 10 秒和快进 10 秒位于画面中央；播放一秒后控制层会淡出，轻点画面会渐显并重新计时。`VideoPlayerWindow` 应只放在希望显示普通窗口的播放页。

模块会在普通窗口、全屏与小窗之间条件渲染同一个播放器，避免 Android 上同一个 `VideoPlayer` 同时挂载多个 `VideoView` 的限制。离开承载普通窗口的页面时会自动切为小窗；小窗在根导航层渲染，因此路由切换后仍会存在。拖动画面区域可调整位置，控制区只保留暂停、关闭、全屏。`returnOrientation` 默认是 `default`；像本项目这样普通页面固定竖屏时传入 `portrait`。

原生配置要求：

1. 安装依赖：`npx expo install expo-video expo-screen-orientation`。
2. 应用方向必须允许横屏（本项目为 `orientation: "default"`）。
3. iOS 需要允许 Landscape；若需要在 iPad 上可靠锁定方向，还需 `ios.requireFullScreen: true`。
4. 添加这些原生依赖后必须重新构建开发包或 APK，不能只通过 OTA 更新上线。
