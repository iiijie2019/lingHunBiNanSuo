import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { BrandColors, Colors } from '@/constants/theme';

const TABS = [
  { name: 'index', title: '航程', icon: 'home' },
  { name: 'games', title: '挑战', icon: 'gamepad' },
  { name: 'utilities', title: '装备', icon: 'wrench' },
  { name: 'profile', title: '星图', icon: 'rocket' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'unspecified' ? 'light' : colorScheme;
  const colors = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundSelected,
          paddingTop: 7,
          height: 72,
          shadowColor: BrandColors.deepSpace,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
        tabBarHideOnKeyboard: true,
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIcon, focused && { backgroundColor: `${colors.primary}18` }]}>
                <FontAwesome name={icon} size={focused ? size : size - 1} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
