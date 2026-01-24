/**
 * Privacy & PII Handling Utilities
 *
 * Provides data masking, PII detection, and privacy compliance helpers.
 */

// Common PII patterns (without global flag to avoid stateful regex issues)
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  phone: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  ssn: /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/,
  creditCard: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  zipCode: /\b\d{5}(-\d{4})?\b/,
};

// Global versions for replace operations
const PII_PATTERNS_GLOBAL = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/g,
  creditCard: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

// Fields that commonly contain PII
const PII_FIELD_NAMES = new Set([
  'email',
  'phone',
  'phoneNumber',
  'ssn',
  'socialSecurity',
  'creditCard',
  'cardNumber',
  'cvv',
  'password',
  'secret',
  'token',
  'apiKey',
  'address',
  'streetAddress',
  'firstName',
  'lastName',
  'fullName',
  'name',
  'dateOfBirth',
  'dob',
  'birthDate',
]);

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  fieldNames: string[];
}

/**
 * Detect PII in a string
 */
export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    fieldNames: [],
  };
}

/**
 * Detect PII in an object (checks field names and values)
 */
export function detectPIIInObject(obj: Record<string, unknown>): PIIDetectionResult {
  const detectedTypes: string[] = [];
  const fieldNames: string[] = [];

  function scan(data: unknown, path = ''): void {
    if (typeof data === 'string') {
      const result = detectPII(data);
      detectedTypes.push(...result.detectedTypes);
    } else if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        const fullPath = path ? `${path}.${key}` : key;

        // Check if field name suggests PII
        if (PII_FIELD_NAMES.has(key.toLowerCase())) {
          fieldNames.push(fullPath);
        }

        scan(value, fullPath);
      }
    }
  }

  scan(obj);

  return {
    hasPII: detectedTypes.length > 0 || fieldNames.length > 0,
    detectedTypes: [...new Set(detectedTypes)],
    fieldNames,
  };
}

/**
 * Mask PII in a string
 */
export function maskPII(text: string): string {
  let masked = text;

  // Mask emails: john@example.com -> j***@***.com
  masked = masked.replace(PII_PATTERNS_GLOBAL.email, (match) => {
    const [local, domain] = match.split('@');
    const lastDot = domain.lastIndexOf('.');
    const tld = lastDot > 0 ? domain.slice(lastDot + 1) : domain;
    return `${local[0]}***@***.${tld}`;
  });

  // Mask phone numbers: 555-123-4567 -> ***-***-4567
  masked = masked.replace(PII_PATTERNS_GLOBAL.phone, (match) => {
    const digits = match.replace(/\D/g, '');
    return `***-***-${digits.slice(-4)}`;
  });

  // Mask credit cards: 1234-5678-9012-3456 -> ****-****-****-3456
  masked = masked.replace(PII_PATTERNS_GLOBAL.creditCard, (match) => {
    const digits = match.replace(/\D/g, '');
    return `****-****-****-${digits.slice(-4)}`;
  });

  // Mask SSN: 123-45-6789 -> ***-**-6789
  masked = masked.replace(PII_PATTERNS_GLOBAL.ssn, (match) => {
    const digits = match.replace(/\D/g, '');
    return `***-**-${digits.slice(-4)}`;
  });

  // Mask IP addresses: 192.168.1.100 -> ***.***.***.100
  masked = masked.replace(PII_PATTERNS_GLOBAL.ipAddress, (match) => {
    const parts = match.split('.');
    return `***.***.***.${parts[3]}`;
  });

  return masked;
}

/**
 * Mask PII fields in an object
 */
export function maskPIIInObject<T extends Record<string, unknown>>(obj: T): T {
  const masked = { ...obj };

  function maskValue(value: unknown, key: string): unknown {
    // Check if field name suggests PII
    if (PII_FIELD_NAMES.has(key.toLowerCase())) {
      if (typeof value === 'string') {
        return value.length > 2 ? `${value[0]}${'*'.repeat(value.length - 2)}${value.slice(-1)}` : '***';
      }
      return '***';
    }

    if (typeof value === 'string') {
      return maskPII(value);
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map((item, i) => maskValue(item, String(i)));
      }
      return maskPIIInObject(value as Record<string, unknown>);
    }

    return value;
  }

  for (const [key, value] of Object.entries(masked)) {
    (masked as Record<string, unknown>)[key] = maskValue(value, key);
  }

  return masked;
}

/**
 * Remove PII fields entirely from an object
 */
export function stripPII<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const stripped: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip PII field names
    if (PII_FIELD_NAMES.has(key.toLowerCase())) {
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (stripped as Record<string, unknown>)[key] = stripPII(value as Record<string, unknown>);
    } else {
      (stripped as Record<string, unknown>)[key] = value;
    }
  }

  return stripped;
}

// Privacy consent types
export type ConsentType = 'analytics' | 'marketing' | 'personalization' | 'thirdParty';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_STORAGE_KEY = 'privacy_consent';
const CONSENT_VERSION = '1.0';

/**
 * Get current consent state
 */
export async function getConsentState(): Promise<ConsentState | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Update consent state
 */
export async function updateConsent(consent: Partial<ConsentState>): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const current = await getConsentState();

    const newState: ConsentState = {
      analytics: consent.analytics ?? current?.analytics ?? false,
      marketing: consent.marketing ?? current?.marketing ?? false,
      personalization: consent.personalization ?? current?.personalization ?? false,
      thirdParty: consent.thirdParty ?? current?.thirdParty ?? false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Failed to save consent:', error);
  }
}

/**
 * Check if specific consent is granted
 */
export async function hasConsent(type: ConsentType): Promise<boolean> {
  const state = await getConsentState();
  return state?.[type] ?? false;
}

/**
 * Clear all consent (for account deletion)
 */
export async function clearConsent(): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear consent:', error);
  }
}
