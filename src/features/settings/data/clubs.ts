// PGA Tour averages from Trackman
export interface ClubData {
  name: string;
  ballSpeed: number;
  launchAngle: number;
  spinRate: number;
  carry: number;
}

export const clubData: ClubData[] = [
  { name: "Driver", ballSpeed: 171, launchAngle: 10.4, spinRate: 2545, carry: 282 },
  { name: "3-Wood", ballSpeed: 162, launchAngle: 9.3, spinRate: 3663, carry: 249 },
  { name: "5-Wood", ballSpeed: 156, launchAngle: 9.7, spinRate: 4322, carry: 236 },
  { name: "Hybrid", ballSpeed: 149, launchAngle: 10.2, spinRate: 4587, carry: 231 },
  { name: "3-Iron", ballSpeed: 145, launchAngle: 10.3, spinRate: 4404, carry: 218 },
  { name: "4-Iron", ballSpeed: 140, launchAngle: 10.8, spinRate: 4782, carry: 209 },
  { name: "5-Iron", ballSpeed: 135, launchAngle: 11.9, spinRate: 5280, carry: 199 },
  { name: "6-Iron", ballSpeed: 130, launchAngle: 14.0, spinRate: 6204, carry: 188 },
  { name: "7-Iron", ballSpeed: 123, launchAngle: 16.1, spinRate: 7124, carry: 176 },
  { name: "8-Iron", ballSpeed: 118, launchAngle: 17.8, spinRate: 8078, carry: 164 },
  { name: "9-Iron", ballSpeed: 112, launchAngle: 20.0, spinRate: 8793, carry: 152 },
  { name: "PW", ballSpeed: 104, launchAngle: 23.7, spinRate: 9316, carry: 142 },
  // Extrapolated wedges with 12-yard gaps
  { name: "GW", ballSpeed: 101, launchAngle: 24.5, spinRate: 9600, carry: 130 },
  { name: "SW", ballSpeed: 98, launchAngle: 25.3, spinRate: 9900, carry: 118 },
  { name: "LW", ballSpeed: 95, launchAngle: 26.1, spinRate: 10200, carry: 106 }
];
