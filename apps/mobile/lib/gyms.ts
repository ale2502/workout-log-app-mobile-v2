import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_GYM_ID_KEY = 'defaultGymId';

export async function getStoredDefaultGymId(): Promise<number | null> {
  const value = await AsyncStorage.getItem(DEFAULT_GYM_ID_KEY);

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

export async function storeDefaultGymId(gymId: number): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_GYM_ID_KEY, String(gymId));
}
