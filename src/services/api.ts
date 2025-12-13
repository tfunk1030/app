// API configuration and types
export interface ShotData {
  distance: number;
  windSpeed: number;
  windDirection: number;
  lateralOffset: number;
  trajectory: [number, number][];
  height: number;
}

export interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
}

// Mock data generator functions
const generateTrajectoryPoints = (distance: number, height: number = 30): [number, number][] => {
  const points: [number, number][] = []
  const numPoints = 50
  for (let i = 0; i < numPoints; i++) {
    const x = (distance * i) / (numPoints - 1)
    const h = height * Math.sin((Math.PI * i) / (numPoints - 1))
    points.push([x, h])
  }
  return points
}

// API service with mock implementations
export const api = {
  // Shot Analysis
  getShotData: async (params: Partial<ShotData>) => {
    // Simulate API delay
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    
    return {
      distance: params.distance || 200,
      windSpeed: params.windSpeed || 10,
      windDirection: params.windDirection || 45,
      lateralOffset: params.lateralOffset || 5,
      trajectory: generateTrajectoryPoints(params.distance || 200),
      height: 30
    };
  },

  // Weather Data 
  getWeatherData: async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    return {
      temperature: 72,
      humidity: 65,
      pressure: 1013,
      windSpeed: 10,
      windDirection: 45
    }
  },

  // Flight Path Calculation
  async calculateFlightPath(params: {
    initialVelocity: number
    launchAngle: number
    spinRate: number
  }): Promise<[number, number, number][]> {
    await new Promise<void>(resolve => setTimeout(resolve, 500))
    
    const points: [number, number, number][] = []
    const numPoints = 50
    const maxHeight = 30
    const distance = params.initialVelocity * 2

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      const x = distance * t
      const y = maxHeight * Math.sin(Math.PI * t)
      const z = 5 * Math.sin(2 * Math.PI * t) // Lateral movement
      points.push([x, y, z])
    }
    
    return points
  },

  // Club Selection
  async getClubRecommendation(distance: number, conditions: any): Promise<{
    club: string
    confidence: number
  }> {
    await new Promise<void>(resolve => setTimeout(resolve, 500))
    
    const clubs = ['Driver', '3-Wood', '5-Wood', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW']
    const index = Math.min(Math.floor(distance / 25), clubs.length - 1)
    
    return {
      club: clubs[index],
      confidence: 0.85
    }
  }
}
