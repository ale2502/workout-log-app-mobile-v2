import { Pressable, StyleSheet, View } from 'react-native';
import {
  getLastDay,
  getMesocycleCardKind,
  getTargetRir,
  type Mesocycle,
  type MesocycleStatus,
} from 'workout-log-shared';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, RirColors, Spacing, rirLabel } from '@/constants/theme';
import { parseApiDate } from '@/lib/dates';

type MesocycleCardProps = {
  mesocycle: Mesocycle | null;
  status: MesocycleStatus | null;
  onStart: () => void;
  onEnd: () => void;
  onCancel: () => void;
};

const PAST_OPACITY = 0.6;
const FUTURE_OPACITY = 0.2;

// "Mon 9 Nov", or "9 Nov" without the weekday (built from parts so there is no comma).
function formatShortDate(date: string, withWeekday: boolean) {
  const parsed = parseApiDate(date);
  const month = parsed.toLocaleDateString('en-NZ', { month: 'short' });
  const base = `${parsed.getDate()} ${month}`;
  if (!withWeekday) return base;
  return `${parsed.toLocaleDateString('en-NZ', { weekday: 'short' })} ${base}`;
}

function rirColor(rir: number) {
  return RirColors[Math.min(rir, 4)];
}

// The label under each segment: W1..Wn for training weeks, then the deload week(s).
// Long words are shortened when the bar is crowded so labels never overflow.
function getWeekLabel(meso: Mesocycle, week: number) {
  if (week <= meso.trainingWeeks) return `W${week}`;
  const totalWeeks = meso.trainingWeeks + meso.deloadWeeks;
  if (meso.deloadWeeks > 1) return `D${week - meso.trainingWeeks}`;
  return totalWeeks > 6 ? 'D' : 'DELOAD';
}

type ChipProps = {
  text: string;
  accessibilityLabel: string;
  // RIR value for a colored chip, or undefined for the neutral chip.
  rir?: number;
};

function Chip({ text, accessibilityLabel, rir }: ChipProps) {
  const isColored = rir !== undefined;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.chip,
        { backgroundColor: isColored ? rirColor(rir) : Colors.surfaceMuted },
      ]}
    >
      <AppText variant="label" color={isColored ? 'onAccent' : 'text'} style={styles.chipText}>
        {text}
      </AppText>
    </View>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  chip?: ChipProps;
};

function Header({ eyebrow, title, chip }: HeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        <AppText variant="label">{eyebrow}</AppText>
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
      </View>
      {chip && <Chip {...chip} />}
    </View>
  );
}

type BarProps = {
  mesocycle: Mesocycle;
  // 1-based current week, or null when no week is current (upcoming, finished).
  currentWeek: number | null;
  // Opacity of every segment when there is no current week.
  uniformOpacity: number;
  accessibilityLabel: string;
};

// One segment per week of the block, colored by that week's target RIR.
function WeekBar({ mesocycle, currentWeek, uniformOpacity, accessibilityLabel }: BarProps) {
  const totalWeeks = mesocycle.trainingWeeks + mesocycle.deloadWeeks;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.bar}>
      {weeks.map((week) => {
        const color = rirColor(getTargetRir(mesocycle, week));
        const isCurrent = week === currentWeek;
        let opacity = uniformOpacity;
        if (currentWeek !== null) {
          opacity = isCurrent ? 1 : week < currentWeek ? PAST_OPACITY : FUTURE_OPACITY;
        }

        return (
          <View key={week} style={styles.barItem}>
            <View style={[styles.segment, { backgroundColor: color, opacity }]} />
            <AppText
              variant="label"
              color={isCurrent ? undefined : 'mutedText'}
              numberOfLines={1}
              style={[styles.segmentLabel, isCurrent && { color }]}
            >
              {getWeekLabel(mesocycle, week)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

type FooterProps = {
  caption: string;
  actionTitle: string;
  onAction: () => void;
};

function Footer({ caption, actionTitle, onAction }: FooterProps) {
  return (
    <View style={styles.footer}>
      <AppText variant="caption" color="mutedText" style={styles.footerCaption}>
        {caption}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
      >
        <AppText variant="caption" color="mutedText" style={styles.textButtonLabel}>
          {actionTitle}
        </AppText>
      </Pressable>
    </View>
  );
}

export function MesocycleCard({
  mesocycle,
  status,
  onStart,
  onEnd,
  onCancel,
}: MesocycleCardProps) {
  const kind = getMesocycleCardKind(status);

  if (mesocycle !== null) {
    const totalWeeks = mesocycle.trainingWeeks + mesocycle.deloadWeeks;
    const eyebrow = `MESOCYCLE · ${mesocycle.trainingWeeks} + ${mesocycle.deloadWeeks}`;
    const lastDay = getLastDay(mesocycle.startDate, totalWeeks);

    if (kind === 'active' && status && (status.phase === 'training' || status.phase === 'deload')) {
      const targetLabel = rirLabel(status.targetRir);
      return (
        <Card>
          <Header
            eyebrow={eyebrow}
            title={`Week ${status.week} of ${status.totalWeeks}`}
            chip={{
              text: `TARGET RIR ${targetLabel}`,
              accessibilityLabel: `Target RIR ${targetLabel === '4+' ? '4 plus' : targetLabel}`,
              rir: Math.min(status.targetRir, 4),
            }}
          />
          <WeekBar
            mesocycle={mesocycle}
            currentWeek={status.week}
            uniformOpacity={PAST_OPACITY}
            accessibilityLabel={`Week ${status.week} of ${status.totalWeeks}`}
          />
          <Footer
            caption={`Started ${formatShortDate(mesocycle.startDate, true)} · ends ${formatShortDate(lastDay, true)}`}
            actionTitle="End block"
            onAction={onEnd}
          />
        </Card>
      );
    }

    if (kind === 'upcoming' && status && status.phase === 'upcoming') {
      const days = status.daysUntilStart;
      const week1Target = rirLabel(getTargetRir(mesocycle, 1));
      return (
        <Card>
          <Header
            eyebrow={eyebrow}
            title={`Starts ${formatShortDate(status.startsOn, true)}`}
            chip={{
              text: `IN ${days} ${days === 1 ? 'DAY' : 'DAYS'}`,
              accessibilityLabel: `Starts in ${days} ${days === 1 ? 'day' : 'days'}`,
            }}
          />
          <WeekBar
            mesocycle={mesocycle}
            currentWeek={null}
            uniformOpacity={FUTURE_OPACITY}
            accessibilityLabel={`Block of ${totalWeeks} weeks, not started yet`}
          />
          <Footer
            caption={`Week 1: RIR ${week1Target} · ends ${formatShortDate(lastDay, true)}`}
            actionTitle="Cancel block"
            onAction={onCancel}
          />
        </Card>
      );
    }

    if (kind === 'finished') {
      return (
        <Card>
          <Header
            eyebrow={eyebrow}
            title="Block finished"
            chip={{
              text: `${totalWeeks} OF ${totalWeeks} WEEKS`,
              accessibilityLabel: `${totalWeeks} of ${totalWeeks} weeks completed`,
            }}
          />
          <WeekBar
            mesocycle={mesocycle}
            currentWeek={null}
            uniformOpacity={PAST_OPACITY}
            accessibilityLabel={`Block of ${totalWeeks} weeks, finished`}
          />
          <AppText variant="caption" color="noteText">
            {`${formatShortDate(mesocycle.startDate, false)} – ${formatShortDate(lastDay, false)}. Nice work. Start the next block when you're ready.`}
          </AppText>
          <Button title="Start a new block" variant="raised" size="md" onPress={onStart} />
        </Card>
      );
    }
  }

  // No block (or one that was ended early / finished long ago).
  return (
    <Card>
      <Header eyebrow="MESOCYCLE" title="Train in blocks" />
      <AppText variant="caption" color="noteText">
        Plan a few training weeks and a deload. Each week gets a harder target RIR.
      </AppText>
      <Button title="Start mesocycle" variant="raised" size="md" onPress={onStart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 26,
    lineHeight: 28,
  },
  chip: {
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bar: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  barItem: {
    flex: 1,
    gap: 6,
  },
  segment: {
    height: 8,
    borderRadius: Radius.pill,
  },
  segmentLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  footerCaption: {
    flex: 1,
  },
  textButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: Spacing.md,
  },
  textButtonLabel: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
