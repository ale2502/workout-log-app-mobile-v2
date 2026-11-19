import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type IconButtonProps = {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  size = 44,
  badge = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
});
