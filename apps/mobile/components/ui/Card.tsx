import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type CardProps = ViewProps & {
  // Adds a thin outline so a card that floats over a dimmed screen (modals)
  // stays distinguishable from the dark background.
  bordered?: boolean;
};

export function Card({ bordered, style, ...rest }: CardProps) {
  return <View style={[styles.card, bordered && styles.bordered, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
