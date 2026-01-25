import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Shot {
  id: string;
  club: string;
  distance: number;
  accuracy: number;
  height: number;
  spin: number;
  date: Date;
}

function generateTestShots(): Shot[] {
  const clubs = ['Driver', '3-Wood', '5-Iron', '7-Iron', 'PW'];
  const shots: Shot[] = [];

  clubs.forEach(club => {
    const baseStats = {
      'Driver': { distance: 280, spread: 20 },
      '3-Wood': { distance: 250, spread: 15 },
      '5-Iron': { distance: 200, spread: 12 },
      '7-Iron': { distance: 170, spread: 10 },
      'PW': { distance: 130, spread: 8 }
    }[club];

    if (!baseStats) return;

    for (let i = 0; i < 20; i++) {
      shots.push({
        id: uuidv4(),
        club,
        distance: baseStats.distance + (Math.random() - 0.5) * 20,
        accuracy: (Math.random() - 0.5) * baseStats.spread * 2,
        height: 30 + Math.random() * 10,
        spin: 2500 + Math.random() * 500,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
  });

  return shots.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function useShots() {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    setShots(generateTestShots());
  }, []);

  return { shots };
}
