import { StyleSheet, Text, View } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';

type SavedSetsTableProps = {
  sets: SetDisplay[];
};

export function SavedSetsTable(props: SavedSetsTableProps) {
  return (
    <View style={styles.setsTable}>
      <View style={styles.tableHeaderRow}>
        <Text style={styles.tableHeaderCell}>Set</Text>
        <Text style={styles.tableHeaderCell}>Reps</Text>
        <Text style={styles.tableHeaderCell}>Load</Text>
        <Text style={styles.tableHeaderCell}>RIR</Text>
      </View>

      {sets.map((set) => (
        <View key={set.id} style={styles.tableRow}>
          <Text style={styles.tableCell}>{set.setNumber}</Text>
          <Text style={styles.tableCell}>{set.reps}</Text>
          <Text style={styles.tableCell}>{set.load ?? '-'}</Text>
          <Text style={styles.tableCell}>{set.rir ?? '-'}</Text>
        </View>
      ))}
    </View>
  );
}
