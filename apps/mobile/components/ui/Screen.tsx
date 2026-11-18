import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = { paddingTop: insets.top };

  if (scroll) {
    // Keep the last content clear of the home indicator on screens without a tab bar.
    const bottomPadding = { paddingBottom: Spacing.xxl + insets.bottom };

    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          topPadding,
          bottomPadding,
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, styles.content, topPadding, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
});
