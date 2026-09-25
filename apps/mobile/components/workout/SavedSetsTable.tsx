import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';

import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SavedSetsTableProps = {
  sets: SetDisplay[];
  onLongPressSet: (set: SetDisplay) => void;
  onPressSet?: (set: SetDisplay) => void;
  onPressNotes?: (set: SetDisplay) => void;
  selectedSetId: number | null;
};

export function SavedSetsTable(props: SavedSetsTableProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.setsTable,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <View
        style={[
          styles.tableHeaderRow,
          { backgroundColor: colors.surfaceMuted },
        ]}
      >
        <Text style={[styles.tableHeaderCell, { color: colors.text }]}>
          Set
        </Text>
        <Text style={[styles.tableHeaderCell, { color: colors.text }]}>
          Reps
        </Text>
        <Text style={[styles.tableHeaderCell, { color: colors.text }]}>
          Load
        </Text>
        <Text style={[styles.tableHeaderCell, { color: colors.text }]}>
          RIR
        </Text>
        <Text style={styles.notesCell}></Text>
      </View>

      {props.sets.map((set) => {
        const isSelected = set.id === props.selectedSetId;

        return (
          <Pressable
            key={set.id}
            onLongPress={() => props.onLongPressSet(set)}
            onPress={() => props.onPressSet?.(set)}
          >
            <View
              style={[
                styles.tableRow,
                { borderTopColor: colors.border },
                isSelected && {
                  backgroundColor:
                    colorScheme === 'dark' ? '#12324a' : '#e0f2fe',
                },
              ]}
            >
              <Text style={[styles.tableCell, { color: colors.text }]}>
                {set.setNumber}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>
                {set.reps}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>
                {set.load ?? '-'}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>
                {set.rir ?? '-'}
              </Text>
              <Pressable style={styles.notesCell}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.mutedText}
                ></Ionicons>
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  setsTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    fontWeight: '700',
  },
  tableCell: {
    flex: 1,
    padding: 10,
  },
  notesCell: {
    width: 48,
    padding: 10,
  },
});
