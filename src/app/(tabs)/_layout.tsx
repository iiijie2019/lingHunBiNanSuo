import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const TABS = [
  { name: 'index', title: '首页', icon: 'home' },
  { name: 'games', title: '游戏', icon: 'gamepad' },
  { name: 'utilities', title: '工具', icon: 'wrench' },
  { name: 'profile', title: '我的', icon: 'user' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'unspecified' ? 'light' : colorScheme;
  const colors = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
        },
        headerShown: false,
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name={icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
