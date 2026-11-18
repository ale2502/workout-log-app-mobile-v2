import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colors = Colors.dark;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="barbell-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
