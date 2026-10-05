// Small secrets (access tokens) live in the iPhone keychain, not in the
// app's JSON files. The keychain is encrypted, stays on this phone
// (ThisDeviceOnly: never synced or restored to another device) and is only
// readable after the phone has been unlocked once since restart.
import * as SecureStore from 'expo-secure-store';

const OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export type SecretKey = 'canvas.token';

const key = (k: SecretKey) => `bn.${k}`;

export async function readSecret(k: SecretKey): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(key(k), OPTS)) ?? '';
  } catch {
    // Keychain locked or unavailable: behave as not connected.
    return '';
  }
}

export async function writeSecret(k: SecretKey, value: string): Promise<boolean> {
  try {
    if (value) await SecureStore.setItemAsync(key(k), value, OPTS);
    else await SecureStore.deleteItemAsync(key(k), OPTS);
    return true;
  } catch {
    return false;
  }
}
