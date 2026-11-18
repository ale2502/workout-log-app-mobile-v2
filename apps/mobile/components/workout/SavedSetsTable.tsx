import { StyleSheet, View, Pressable } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Colors, Fonts, RirColors, rirLabel, rirTint } from '@/constants/theme';

type SavedSetsTableProps = {
  sets: SetDisplay[];
  onLongPressSet: (set: SetDisplay) => void;
  onPressSet?: (set: SetDisplay) => void;
  onPressNotes?: (set: SetDisplay) => void;
  selectedSetId: number | null;
};

// Column widths shared by the header and the rows so they line up. NOTE takes the rest.
const SET_WIDTH = 34;
const KG_WIDTH = 44;
const REPS_WIDTH = 44;
const RIR_WIDTH = 36;

export function SavedSetsTable(props: SavedSetsTableProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="label" style={[styles.headerLabel, { width: SET_WIDTH }]}>
          Set
        </AppText>
        <AppText variant="label" style={[styles.headerLabel, { width: KG_WIDTH }]}>
          Kg
        </AppText>
        <AppText variant="label" style={[styles.headerLabel, { width: REPS_WIDTH }]}>
          Reps
        </AppText>
        <AppText variant="label" style={[styles.headerLabel, { width: RIR_WIDTH }]}>
          RIR
        </AppText>
        <AppText variant="label" style={[styles.headerLabel, styles.noteColumn]}>
          Note
        </AppText>
      </View>

      {props.sets.map((set) => {
        const isSelected = set.id === props.selectedSetId;
        // The API returns RIR as a float (2.0). Round it so legacy half-step values
        // (e.g. 1.5) still map to a valid color and label.
        const rir = set.rir === null ? null : Math.round(set.rir);

        const noteContent = (
          <AppText
            variant="caption"
            color={set.note ? 'noteText' : 'placeholder'}
            numberOfLines={1}
            style={styles.noteText}
          >
            {set.note ? set.note : '—'}
          </AppText>
        );

        return (
          <Pressable
            key={set.id}
            onLongPress={() => props.onLongPressSet(set)}
            onPress={() =>
              props.onPressSet ? props.onPressSet(set) : props.onPressNotes?.(set)
            }
            style={[
              styles.row,
              {
                backgroundColor:
                  rir === null ? Colors.dark.surfaceMuted : rirTint(rir),
                borderColor: isSelected ? Colors.dark.text : 'transparent',
              },
            ]}
          >
            <AppText variant="cell" color="mutedText" style={{ width: SET_WIDTH }}>
              {set.setNumber}
            </AppText>
            <AppText variant="cell" style={{ width: KG_WIDTH }}>
              {set.load === null ? '—' : set.load}
            </AppText>
            <AppText variant="cell" style={{ width: REPS_WIDTH }}>
              {set.reps}
            </AppText>
            <View style={{ width: RIR_WIDTH }}>
              {rir === null ? (
                <AppText variant="cell" color="mutedText">
                  —
                </AppText>
              ) : (
                <View style={[styles.rirBadge, { backgroundColor: RirColors[Math.min(rir, 4)] }]}>
                  <AppText style={styles.rirBadgeText} color="onAccent">
                    {rirLabel(rir)}
                  </AppText>
                </View>
              )}
            </View>
            {props.onPressNotes ? (
              <Pressable
                onPress={() => props.onPressNotes?.(set)}
                accessibilityLabel={`Edit note for set ${set.setNumber}`}
                style={styles.noteColumn}
              >
                {noteContent}
              </Pressable>
            ) : (
              <View style={styles.noteColumn}>{noteContent}</View>
            )}
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 6,
    paddingHorizontal: 6,
    paddingBottom: 8,
    gap: 0,
  },
  headerRow: {
    height: 30,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: {
    letterSpacing: 1.1,
  },
  row: {
    minHeight: 40,
    marginTop: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteColumn: {
    flex: 1,
  },
  noteText: {
    fontSize: 13,
    paddingVertical: 8,
  },
  rirBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirBadgeText: {
    fontFamily: Fonts.display,
    fontSize: 17,
    fontWeight: 'normal', // AppText's default body variant is weight 600; the display font has its own weights
  },
});
