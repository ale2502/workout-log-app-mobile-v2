import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Type } from '@/constants/theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof Type;
  color?: keyof typeof Colors.dark;
};

export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  // Labels are muted by default, everything else uses the main text color.
  const colorKey = color ?? (variant === 'label' ? 'mutedText' : 'text');

  return (
    <Text
      style={[styles.base, Type[variant], { color: Colors.dark[colorKey] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.dark.text,
  },
});
