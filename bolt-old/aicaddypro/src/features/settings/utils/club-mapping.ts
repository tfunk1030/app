export function normalizeClubName(clubName: string): string {
  const input = clubName.trim();
  const mappings: Record<string, string> = {
    // Driver variants
    'driver': 'driver',
    'drv': 'driver',
    'd': 'driver',
    '1w': 'driver',
    '1 w': 'driver',
    '1-w': 'driver',
    '1wood': 'driver',
    '1 wood': 'driver',
    '1-wood': 'driver',
    
    // Woods
    '3w': '3-wood',
    '3 w': '3-wood',
    '3-w': '3-wood',
    '3wood': '3-wood',
    '3 wood': '3-wood',
    '3-wood': '3-wood',
    'threewood': '3-wood',
    'three-wood': '3-wood',
    
    '5w': '5-wood',
    '5 w': '5-wood',
    '5-w': '5-wood',
    '5wood': '5-wood',
    '5 wood': '5-wood',
    '5-wood': '5-wood',
    'fivewood': '5-wood',
    'five-wood': '5-wood',
    
    '7w': '7-wood',
    '7 w': '7-wood',
    '7-w': '7-wood',
    '7wood': '7-wood',
    '7 wood': '7-wood',
    '7-wood': '7-wood',
    'sevenwood': '7-wood',
    'seven-wood': '7-wood',
    
    // Hybrid
    'hybrid': 'hybrid',
    'hyb': 'hybrid',
    'h': 'hybrid',
    'rescue': 'hybrid',
    
    // Irons
    '2i': '2-iron',
    '2 i': '2-iron',
    '2-i': '2-iron',
    '2iron': '2-iron',
    '2 iron': '2-iron',
    '2-iron': '2-iron',
    'twoiron': '2-iron',
    'two-iron': '2-iron',
    
    '3i': '3-iron',
    '3 i': '3-iron',
    '3-i': '3-iron',
    '3iron': '3-iron',
    '3 iron': '3-iron',
    '3-iron': '3-iron',
    'threeiron': '3-iron',
    'three-iron': '3-iron',
    
    '4i': '4-iron',
    '4 i': '4-iron',
    '4-i': '4-iron',
    '4iron': '4-iron',
    '4 iron': '4-iron',
    '4-iron': '4-iron',
    'fouriron': '4-iron',
    'four-iron': '4-iron',
    
    '5i': '5-iron',
    '5 i': '5-iron',
    '5-i': '5-iron',
    '5iron': '5-iron',
    '5 iron': '5-iron',
    '5-iron': '5-iron',
    'fiveiron': '5-iron',
    'five-iron': '5-iron',
    
    '6i': '6-iron',
    '6 i': '6-iron',
    '6-i': '6-iron',
    '6iron': '6-iron',
    '6 iron': '6-iron',
    '6-iron': '6-iron',
    'sixiron': '6-iron',
    'six-iron': '6-iron',
    
    '7i': '7-iron',
    '7 i': '7-iron',
    '7-i': '7-iron',
    '7iron': '7-iron',
    '7 iron': '7-iron',
    '7-iron': '7-iron',
    'seveniron': '7-iron',
    'seven-iron': '7-iron',
    
    '8i': '8-iron',
    '8 i': '8-iron',
    '8-i': '8-iron',
    '8iron': '8-iron',
    '8 iron': '8-iron',
    '8-iron': '8-iron',
    'eightiron': '8-iron',
    'eight-iron': '8-iron',
    
    '9i': '9-iron',
    '9 i': '9-iron',
    '9-i': '9-iron',
    '9iron': '9-iron',
    '9 iron': '9-iron',
    '9-iron': '9-iron',
    'nineiron': '9-iron',
    'nine-iron': '9-iron',
    
    // Wedges
    'pw': 'pitching-wedge',
    'p w': 'pitching-wedge',
    'p-w': 'pitching-wedge',
    'pwedge': 'pitching-wedge',
    'p wedge': 'pitching-wedge',
    'p-wedge': 'pitching-wedge',
    'pitching': 'pitching-wedge',
    'pitchingwedge': 'pitching-wedge',
    'pitching wedge': 'pitching-wedge',
    'pitching-wedge': 'pitching-wedge',
    
    'gw': 'gap-wedge',
    'g w': 'gap-wedge',
    'g-w': 'gap-wedge',
    'gwedge': 'gap-wedge',
    'g wedge': 'gap-wedge',
    'g-wedge': 'gap-wedge',
    'gap': 'gap-wedge',
    'gapwedge': 'gap-wedge',
    'gap wedge': 'gap-wedge',
    'gap-wedge': 'gap-wedge',
    'aw': 'gap-wedge',
    'a w': 'gap-wedge',
    'a-w': 'gap-wedge',
    'approach': 'gap-wedge',
    'approachwedge': 'gap-wedge',
    'approach wedge': 'gap-wedge',
    'approach-wedge': 'gap-wedge',
    
    'sw': 'sand-wedge',
    's w': 'sand-wedge',
    's-w': 'sand-wedge',
    'swedge': 'sand-wedge',
    's wedge': 'sand-wedge',
    's-wedge': 'sand-wedge',
    'sand': 'sand-wedge',
    'sandwedge': 'sand-wedge',
    'sand wedge': 'sand-wedge',
    'sand-wedge': 'sand-wedge',
    
    'lw': 'lob-wedge',
    'l w': 'lob-wedge',
    'l-w': 'lob-wedge',
    'lwedge': 'lob-wedge',
    'l wedge': 'lob-wedge',
    'l-wedge': 'lob-wedge',
    'lob': 'lob-wedge',
    'lobwedge': 'lob-wedge',
    'lob wedge': 'lob-wedge',
    'lob-wedge': 'lob-wedge'
  };

  // Try exact match first
  if (mappings[input.toLowerCase()]) {
    return mappings[input.toLowerCase()];
  }

  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  const patterns = [
    { regex: /^(\d+)(?:iron|i)$/i, replace: '$1-iron' },
    { regex: /^(\d+)(?:wood|w)$/i, replace: '$1-wood' },
    { regex: /^(\d+)$/i, replace: '$1-iron' }
  ];

  for (const { regex, replace } of patterns) {
    if (regex.test(normalized)) {
      const mapped = normalized.replace(regex, replace);
      if (mappings[mapped]) {
        return mappings[mapped];
      }
    }
  }

  return input.toLowerCase();
}