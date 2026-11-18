import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Colors, Radius, Spacing } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'lg' | 'md';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
};

const variantStyles = {
  primary: { background: Colors.dark.accent, text: 'onAccent' },
  secondary: { background: Colors.dark.surface, text: 'text' },
  destructive: { background: Colors.dark.destructive, text: 'onPrimary' },
} as const;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const { background, text } = variantStyles[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, height: size === 'lg' ? 64 : 56 },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.dark[text]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText
            variant="button"
            color={text}
            style={size === 'lg' && styles.largeText}
          >
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  largeText: {
    fontSize: 24,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
