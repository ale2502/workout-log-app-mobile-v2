import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Colors, Radius } from '@/constants/theme';
import type { WeekDay, WeekDayState } from '@/lib/week';

type WeekStripProps = {
  days: WeekDay[];
};

// Full names for screen readers: the single-letter labels can't tell Tuesday from Thursday.
const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const ACCESSIBILITY_LABELS: Record<WeekDayState, string> = {
  done: 'Trained',
  today: 'Today',
  future: 'Not trained',
  missed: 'Not trained',
};

export function WeekStrip({ days }: WeekStripProps) {
  return (
    <View style={styles.row}>
      {days.map((day, index) => (
        <View key={index} style={styles.column}>
          <View
            accessible
            accessibilityLabel={`${DAY_NAMES[index]}: ${ACCESSIBILITY_LABELS[day.state]}`}
            style={[
              styles.box,
              day.state === 'done' && styles.boxDone,
              day.state === 'today' && styles.boxToday,
              (day.state === 'future' || day.state === 'missed') && styles.boxEmpty,
            ]}
          />
          <AppText
            variant="label"
            color={day.state === 'today' ? 'accent' : 'mutedText'}
            style={styles.label}
          >
            {day.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
    gap: 6,
  },
  box: {
    height: 36,
    borderRadius: Radius.sm,
  },
  boxDone: {
    backgroundColor: Colors.dark.accent,
  },
  boxToday: {
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  boxEmpty: {
    backgroundColor: Colors.dark.surfaceMuted,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0,
  },
});
