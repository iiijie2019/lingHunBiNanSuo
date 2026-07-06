import { Link } from 'expo-router';
import { Alert, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/** 尝试唤起 suling app */
async function openSulingApp(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('无法打开', `设备不支持该链接:\n${url}`);
    }
  } catch (error) {
    Alert.alert('打开失败', `${error}`);
  }
}

const SULING_URLS = [
  { label: 'suling://', url: 'sulingai://isDoctorAgent=true' },
  { label: 'suling://open', url: 'suling://isDoctorAgent=true&idf=261&platformSource=1' },
  { label: 'suling://main', url: 'suling://main' },
  { label: 'sulingapp://', url: 'sulingapp://' },
  { label: 'srlink://', url: 'srlink://' },
] as const;

export default function TestScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          测试页面
        </ThemedText>

        	<a href="suling://isDoctorAgent=true&idf=261&platformSource=1">
            <button>测试外部唤起，suling 打开首页，控制进入舌诊聊天页</button>
          </a>

        <ThemedText type="small" style={styles.hint}>
          点击下方按钮唤起 suling app (速羚)
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.buttonGroup}>
          {SULING_URLS.map((item) => (
            <ThemedView
              key={item.url}
              style={styles.button}
              onTouchEnd={() => openSulingApp(item.url)}
            >
              <ThemedText type="code" style={styles.buttonText}>
                {item.label}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <Link href="/" style={styles.backButton}>
          <ThemedText type="code" style={styles.backButtonText}>
            返回首页
          </ThemedText>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.four,
    paddingBottom: Spacing.four,
    maxWidth: 500,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.6,
  },
  buttonGroup: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  button: {
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  backButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#208AEF',
  },
  backButtonText: {
    color: '#208AEF',
    textTransform: 'uppercase',
  },
});
