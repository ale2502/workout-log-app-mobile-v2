import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  DEFAULT_MESOCYCLE_SETTINGS,
  daysBetween,
  getLastDay,
  getNextStartDate,
  getTargetRir,
  stepMesocycleSetting,
  type MesocycleSettings,
} from 'workout-log-shared';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatShortDate } from '@/components/workout/MesocycleCard';
import { Colors, Radius, RirColors, Spacing, rirLabel } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { startMesocycle } from '@/lib/api/mesocycles';

type StartMesocycleModalProps = {
  // Today's local date as YYYY-MM-DD. Passed in so this component never reads the clock.
  today: string;
  onClose: () => void;
  onStarted: () => void;
};

type SettingRow = {
  field: keyof MesocycleSettings;
  label: string;
  caption: string;
  // How the label reads in accessibility text ("Increase training weeks").
  noun: string;
  isRir: boolean;
};

const SETTING_ROWS: SettingRow[] = [
  { field: 'trainingWeeks', label: 'Training weeks', caption: '2 to 8', noun: 'training weeks', isRir: false },
  { field: 'deloadWeeks', label: 'Deload weeks', caption: '0 to 2', noun: 'deload weeks', isRir: false },
  { field: 'startRir', label: 'First week RIR', caption: 'Easiest target', noun: 'first week RIR', isRir: true },
  { field: 'endRir', label: 'Last week RIR', caption: 'Hardest target', noun: 'last week RIR', isRir: true },
];

// The label under each chip: W1..Wn for training weeks, then D (one deload week) or D1, D2.
function getWeekLabel(settings: MesocycleSettings, week: number) {
  if (week <= settings.trainingWeeks) return `W${week}`;
  return settings.deloadWeeks > 1 ? `D${week - settings.trainingWeeks}` : 'D';
}

type StepButtonProps = {
  glyph: string;
  accessibilityLabel: string;
  isDisabled: boolean;
  onPress: () => void;
};

function StepButton({ glyph, accessibilityLabel, isDisabled, onPress }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        isDisabled && styles.stepButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      <AppText style={styles.glyph}>{glyph}</AppText>
    </Pressable>
  );
}

export function StartMesocycleModal({ today, onClose, onStarted }: StartMesocycleModalProps) {
  // The parent mounts this only while it is open, so the form resets to the defaults every time.
  const [settings, setSettings] = useState(DEFAULT_MESOCYCLE_SETTINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = getNextStartDate(today);
  const isToday = startDate === today;
  const daysUntilStart = daysBetween(today, startDate);
  const totalWeeks = settings.trainingWeeks + settings.deloadWeeks;
  const lastDay = getLastDay(startDate, totalWeeks);
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  async function handleStart() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await startMesocycle({ startDate, ...settings });
      onStarted();
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.serverMessage === 'string'
          ? err.serverMessage
          : 'Could not start mesocycle',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.modalBackdrop}>
        <Card bordered style={styles.modalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <AppText variant="label">NEW BLOCK</AppText>
              <AppText variant="title" style={styles.title}>
                Start mesocycle
              </AppText>
            </View>

            <View style={styles.rows}>
              {SETTING_ROWS.map((row) => {
                const value = settings[row.field];
                const valueText = row.isRir ? rirLabel(value) : String(value);
                const spokenValue = valueText === '4+' ? '4 plus' : valueText;
                const decreased = stepMesocycleSetting(settings, row.field, -1);
                const increased = stepMesocycleSetting(settings, row.field, 1);

                return (
                  <View key={row.field} style={styles.row}>
                    <View style={styles.rowText}>
                      <AppText variant="body">{row.label}</AppText>
                      <AppText variant="caption" color="mutedText">
                        {row.caption}
                      </AppText>
                    </View>
                    <View style={styles.stepper}>
                      <StepButton
                        glyph={'−'}
                        accessibilityLabel={`Decrease ${row.noun}`}
                        isDisabled={decreased === settings}
                        onPress={() => setSettings(decreased)}
                      />
                      <AppText
                        variant="button"
                        accessibilityLabel={`${row.label}, ${spokenValue}`}
                        style={styles.value}
                      >
                        {valueText}
                      </AppText>
                      <StepButton
                        glyph="+"
                        accessibilityLabel={`Increase ${row.noun}`}
                        isDisabled={increased === settings}
                        onPress={() => setSettings(increased)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <AppText variant="label">STARTS</AppText>
              <View style={styles.recessed}>
                <AppText variant="body">
                  {isToday
                    ? `Today · ${formatShortDate(startDate, true)}`
                    : `Next Monday · ${formatShortDate(startDate, false)}`}
                </AppText>
                <AppText variant="caption" color="mutedText">
                  {isToday
                    ? 'Blocks always start on a Monday'
                    : `Blocks always start on a Monday, so this one begins in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`}
                </AppText>
              </View>
            </View>

            <View style={styles.section}>
              <AppText variant="label">TARGET RIR BY WEEK</AppText>
              <View style={[styles.recessed, styles.weeks]}>
                {weeks.map((week) => {
                  const rir = getTargetRir(settings, week);
                  return (
                    <View key={week} style={styles.weekColumn}>
                      <View
                        style={[
                          styles.weekChip,
                          { backgroundColor: RirColors[Math.min(rir, 4)] },
                        ]}
                      >
                        <AppText variant="button" color="onAccent" style={styles.weekChipText}>
                          {rirLabel(rir)}
                        </AppText>
                      </View>
                      <AppText
                        variant="label"
                        numberOfLines={1}
                        style={styles.weekLabel}
                      >
                        {getWeekLabel(settings, week)}
                      </AppText>
                    </View>
                  );
                })}
              </View>
              <AppText variant="caption" color="mutedText">
                {`${totalWeeks} weeks · ${formatShortDate(startDate, true)} to ${formatShortDate(lastDay, true)}`}
              </AppText>
            </View>

            {error !== null && (
              <AppText variant="caption" color="destructive">
                {error}
              </AppText>
            )}

            <View style={styles.actions}>
              <View style={styles.action}>
                <Button title="Cancel" variant="raised" size="md" onPress={onClose} />
              </View>
              <View style={styles.action}>
                <Button
                  title="Start block"
                  variant="primary"
                  size="md"
                  onPress={handleStart}
                  loading={isSubmitting}
                />
              </View>
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
  },
  content: {
    gap: Spacing.md,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 30,
    lineHeight: 30,
  },
  rows: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
  },
  stepButtonDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.85,
  },
  glyph: {
    fontSize: 22,
  },
  value: {
    width: 40,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0,
    textAlign: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  recessed: {
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  weeks: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: 10,
  },
  weekColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  weekChip: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  weekChipText: {
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 0,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  action: {
    flex: 1,
  },
});
