/**
 * Secure Storage Service
 * Provides encrypted localStorage with migration support
 */

import { encrypt, decrypt, isCryptoAvailable } from './crypto';

const ENCRYPTED_PREFIX = 'enc:';

/**
 * Check if a value is encrypted
 */
function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Store a value securely (encrypted if available)
 */
export async function secureSet(key: string, value: string): Promise<void> {
  if (isCryptoAvailable()) {
    const encrypted = await encrypt(value);
    localStorage.setItem(key, ENCRYPTED_PREFIX + encrypted);
  } else {
    // Fallback to simple obfuscation
    localStorage.setItem(key, btoa(value));
  }
}

/**
 * Retrieve a securely stored value
 * Handles migration from plaintext/obfuscated to encrypted
 */
export async function secureGet(key: string): Promise<string | null> {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    if (isEncrypted(stored)) {
      // Encrypted value
      const ciphertext = stored.slice(ENCRYPTED_PREFIX.length);
      return await decrypt(ciphertext);
    } else {
      // Try base64 decode (obfuscated), fall back to plaintext
      try {
        return atob(stored);
      } catch {
        // Plaintext (legacy)
        return stored;
      }
    }
  } catch (error) {
    console.error('Failed to retrieve secure value:', error);
    return null;
  }
}

/**
 * Remove a securely stored value
 */
export function secureRemove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Store an object securely (JSON serialized and encrypted)
 */
export async function secureSetObject<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  await secureSet(key, json);
}

/**
 * Retrieve a securely stored object
 */
export async function secureGetObject<T>(key: string): Promise<T | null> {
  const value = await secureGet(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Migrate existing plaintext storage to encrypted
 */
export async function migrateToEncrypted(key: string): Promise<boolean> {
  const stored = localStorage.getItem(key);
  if (!stored || isEncrypted(stored)) return false;

  try {
    // Get the current value (handles plaintext and obfuscated)
    const value = await secureGet(key);
    if (!value) return false;

    // Re-store with encryption
    await secureSet(key, value);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
