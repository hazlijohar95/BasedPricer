/**
 * API Keys Service Tests
 * Tests for API key storage, validation, and management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAPIKey,
  getAPIKey,
  removeAPIKey,
  getStoredKeys,
  validateKeyFormat,
  maskAPIKey,
  hasAnyAIKey,
} from './api-keys';

describe('api-keys service', () => {
  beforeEach(() => {
    // Clear localStorage before each test (done in setup.ts)
  });

  describe('saveAPIKey and getAPIKey', () => {
    it('should save and retrieve OpenAI API key', () => {
      const key = 'sk-proj-test123456789abcdefgh';
      const result = saveAPIKey('openai', key);
      expect(result.success).toBe(true);
      expect(getAPIKey('openai')).toBe(key);
    });

    it('should save and retrieve Anthropic API key', () => {
      const key = 'sk-ant-test1234567890abcdefgh';
      const result = saveAPIKey('anthropic', key);
      expect(result.success).toBe(true);
      expect(getAPIKey('anthropic')).toBe(key);
    });

    it('should return null for non-existent key', () => {
      expect(getAPIKey('openai')).toBeNull();
    });

    it('should fail for invalid key format', () => {
      const result = saveAPIKey('openai', 'invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('removeAPIKey', () => {
    it('should remove a stored API key', () => {
      const key = 'sk-test1234567890abcdefgh';
      saveAPIKey('openai', key);
      expect(getAPIKey('openai')).toBe(key);

      removeAPIKey('openai');
      expect(getAPIKey('openai')).toBeNull();
    });
  });

  describe('hasAnyAIKey', () => {
    it('should return true if any key exists', () => {
      saveAPIKey('openai', 'sk-test1234567890abcdefgh');
      expect(hasAnyAIKey()).toBe(true);
    });

    it('should return false if no keys exist', () => {
      expect(hasAnyAIKey()).toBe(false);
    });
  });

  describe('getStoredKeys', () => {
    it('should return storage object with keys', () => {
      saveAPIKey('openai', 'sk-test1234567890abcdefgh');

      const storage = getStoredKeys();
      expect(storage.keys).toBeDefined();
      expect(storage.keys.openai).not.toBeNull();
      expect(storage.keys.openai?.key).toBe('sk-test1234567890abcdefgh');
    });

    it('should return empty keys object when no keys stored', () => {
      const storage = getStoredKeys();
      expect(storage.keys.openai).toBeNull();
      expect(storage.keys.anthropic).toBeNull();
    });
  });

  describe('validateKeyFormat', () => {
    it('should validate OpenAI key format', () => {
      expect(validateKeyFormat('openai', 'sk-proj-abc123456789xyz').valid).toBe(true);
      expect(validateKeyFormat('openai', 'sk-abc123456789xyzabc').valid).toBe(true);
      expect(validateKeyFormat('openai', 'invalid').valid).toBe(false);
    });

    it('should validate Anthropic key format', () => {
      expect(validateKeyFormat('anthropic', 'sk-ant-test123456789abcdefgh').valid).toBe(true);
      expect(validateKeyFormat('anthropic', 'invalid').valid).toBe(false);
    });

    it('should validate OpenRouter key format', () => {
      expect(validateKeyFormat('openrouter', 'sk-or-test123456789abcdefgh').valid).toBe(true);
      expect(validateKeyFormat('openrouter', 'invalid').valid).toBe(false);
    });

    it('should validate Groq key format', () => {
      expect(validateKeyFormat('groq', 'gsk_test1234567890abcdefgh').valid).toBe(true);
      expect(validateKeyFormat('groq', 'invalid').valid).toBe(false);
    });

    it('should be lenient for MiniMax keys', () => {
      // MiniMax just needs 20+ characters
      expect(validateKeyFormat('minimax', 'abcdefghij1234567890').valid).toBe(true);
      expect(validateKeyFormat('minimax', 'short').valid).toBe(false);
    });

    it('should return error for empty key', () => {
      const result = validateKeyFormat('openai', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is required');
    });
  });

  describe('maskAPIKey', () => {
    it('should mask middle portion of API key', () => {
      const masked = maskAPIKey('sk-proj-abcdefghijklmnop');
      expect(masked).toBe('sk-proj...mnop');
      expect(masked).not.toBe('sk-proj-abcdefghijklmnop');
    });

    it('should handle short keys', () => {
      const masked = maskAPIKey('shortkey');
      // For keys <= 15 chars, shows first 4 + last 4
      expect(masked).toBe('shor...tkey');
    });
  });
});
