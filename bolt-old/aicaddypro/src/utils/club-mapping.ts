// Map various club name formats to standardized keys
const clubMappings: Record<string, string> = {
  // Driver variations
  'driver': 'driver',
  '1w': 'driver',
  '1-wood': 'driver',
  
  // Woods
  '3w': '3-wood',
  '3-wood': '3-wood',
  '5w': '5-wood',
  '5-wood': '5-wood',
  
  // Hybrid
  'hybrid': 'hybrid',
  '3h': 'hybrid',
  '4h': 'hybrid',
  
  // Irons
  '3i': '3-iron',
  '3-iron': '3-iron',
  '4i': '4-iron',
  '4-iron': '4-iron',
  '5i': '5-iron',
  '5-iron': '5-iron',
  '6i': '6-iron',
  '6-iron': '6-iron',
  '7i': '7-iron',
  '7-iron': '7-iron',
  '8i': '8-iron',
  '8-iron': '8-iron',
  '9i': '9-iron',
  '9-iron': '9-iron',
  
  // Wedges
  'pw': 'pitching-wedge',
  'p': 'pitching-wedge',
  'pitching': 'pitching-wedge',
  'pitching wedge': 'pitching-wedge',
  'pitching-wedge': 'pitching-wedge',
  
  'gw': 'gap-wedge',
  'g': 'gap-wedge',
  'gap': 'gap-wedge',
  'gap wedge': 'gap-wedge',
  'gap-wedge': 'gap-wedge',
  'approach': 'gap-wedge',
  'aw': 'gap-wedge',
  
  'sw': 'sand-wedge',
  's': 'sand-wedge',
  'sand': 'sand-wedge',
  'sand wedge': 'sand-wedge',
  'sand-wedge': 'sand-wedge',
  
  'lw': 'lob-wedge',
  'l': 'lob-wedge',
  'lob': 'lob-wedge',
  'lob wedge': 'lob-wedge',
  'lob-wedge': 'lob-wedge'
};

/**
 * Normalizes club names to a standard format
 * @param input The club name to normalize
 * @returns The normalized club name or null if not found
 */
export function normalizeClubName(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  return clubMappings[normalized] || null;
}

/**
 * Checks if a club name is valid
 * @param input The club name to validate
 * @returns boolean indicating if the club name is valid
 */
export function isValidClub(input: string): boolean {
  const normalized = normalizeClubName(input);
  return normalized !== null;
}

/**
 * Gets all valid club names
 * @returns Array of valid club names
 */
export function getValidClubNames(): string[] {
  return [...new Set(Object.values(clubMappings))];
}