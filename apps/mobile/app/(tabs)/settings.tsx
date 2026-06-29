import { useCallback, useState } from 'react';
import { Pressable, Switch, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-color-scheme';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';

interface Gym {
  id: number;
  name: string;
}

export default function SettingsScreen() {
  const { colorScheme, isDarkModeEnabled, setIsDarkModeEnabled } =
    useThemeMode();
  const colors = Colors[colorScheme];
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [defaultGymId, setDefaultGymId] = useState<number | null>(null);
  const [newGymName, setNewGymName] = useState('');
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGyms = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`);

      if (!response.ok) {
        throw new Error('Failed to load gyms');
      }

      const data: Gym[] = await response.json();
      setGyms(data);

      const storedGymId = await getStoredDefaultGymId();
      const nextDefaultGymId = storedGymId ?? data[0]?.id ?? null;

      setDefaultGymId(nextDefaultGymId);

      if (nextDefaultGymId !== null) {
        await storeDefaultGymId(nextDefaultGymId);
      }
    } catch {
      setError('Could not load gyms');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGyms();
    }, [loadGyms]),
  );

  async function handleAddGym() {
    if (newGymName.trim() === '') {
      setError('Gym name is required');
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGymName }),
      });

      if (!response.ok) {
        throw new Error('Failed to add gym');
      }

      const gym: Gym = await response.json();
      await storeDefaultGymId(gym.id);
      setDefaultGymId(gym.id);
      setNewGymName('');
      setIsGymDropdownOpen(false);
      await loadGyms();
    } catch {
      setError('Could not add gym');
    }
  }

  async function handleSelectGym(gymId: number) {
    await storeDefaultGymId(gymId);
    setDefaultGymId(gymId);
    setIsGymDropdownOpen(false);
  }

  const selectedGym = gyms.find((gym) => gym.id === defaultGymId);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      <View
        style={[
          styles.settingCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.settingCopy}>
          <ThemedText type="defaultSemiBold">Dark mode</ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedText }]}>
            Use the darker app palette across the workout screens.
          </ThemedText>
        </View>

        <Switch
          value={isDarkModeEnabled}
          onValueChange={setIsDarkModeEnabled}
          trackColor={{
            false: colors.border,
            true: colors.tint,
          }}
          thumbColor={isDarkModeEnabled ? '#f8fafc' : '#f4f4f5'}
          ios_backgroundColor={colors.border}
        />
      </View>

      <View
        style={[
          styles.settingCard,
          styles.settingCardColumn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.gymSection}>
          <ThemedText type="defaultSemiBold">Default gym</ThemedText>

          <View style={styles.dropdownContainer}>
            <Pressable
              style={[
                styles.field,
                styles.dropdownButton,
                isGymDropdownOpen && styles.dropdownButtonOpen,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                setIsGymDropdownOpen((currentValue) => !currentValue)
              }
            >
              <Text style={[styles.fieldText, { color: colors.text }]}>
                {selectedGym?.name ?? 'Select gym'}
              </Text>
              <Ionicons
                name={isGymDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </Pressable>

            {isGymDropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {gyms.map((gym, index) => {
                  const isSelected = gym.id === defaultGymId;
                  const isLastOption = index === gyms.length - 1;

                  return (
                    <Pressable
                      key={gym.id}
                      style={[
                        styles.dropdownOption,
                        { backgroundColor: colors.surface },
                        !isLastOption && [
                          styles.dropdownOptionBorder,
                          { borderBottomColor: colors.border },
                        ],
                        isSelected && { backgroundColor: colors.surfaceMuted },
                      ]}
                      onPress={() => handleSelectGym(gym.id)}
                    >
                      <Text style={[styles.fieldText, { color: colors.text }]}>
                        {gym.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <TextInput
            style={[
              styles.field,
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Add gym"
            placeholderTextColor={colors.mutedText}
            value={newGymName}
            onChangeText={setNewGymName}
          />

          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddGym}
          >
            <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>
              Add gym
            </Text>
          </Pressable>

          {error && (
            <ThemedText style={{ color: colors.destructive }}>
              {error}
            </ThemedText>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  settingCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingCardColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  gymSection: {
    gap: 16,
  },
  description: {
    lineHeight: 20,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2,
  },
  field: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  fieldText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 3,
    elevation: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 12,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
  },
  input: {
    fontSize: 16,
  },
  addButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: '700',
  },
});
