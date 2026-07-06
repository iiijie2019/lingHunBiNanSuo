import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  APP_STATE: '@linghun_app_state',
} as const;

/**
 * Load the entire app state from AsyncStorage.
 * Returns null if nothing has been saved yet.
 */
export async function loadState<T>(): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (json === null) return null;
    return JSON.parse(json) as T;
  } catch (e) {
    console.warn('[storage] Failed to load state:', e);
    return null;
  }
}

/**
 * Save the entire app state to AsyncStorage.
 */
export async function saveState<T>(state: T): Promise<void> {
  try {
    const json = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE, json);
  } catch (e) {
    console.warn('[storage] Failed to save state:', e);
  }
}
