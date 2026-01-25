import Constants from 'expo-constants';

interface ElevationResponse {
  results: {
    elevation: number;
  }[];
}

export class ElevationService {
  private static instance: ElevationService;
  private cache: Map<string, { elevation: number; timestamp: number }>;
  private readonly CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour cache for elevation data
  private readonly API_URL = 'https://api.open-elevation.com/api/v1/lookup';

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): ElevationService {
    if (!ElevationService.instance) {
      ElevationService.instance = new ElevationService();
    }
    return ElevationService.instance;
  }

  public async getElevation(lat: number, lng: number): Promise<number> {
    try {
      const cacheKey = `${lat},${lng}`;
      const cached = this.cache.get(cacheKey);
      
      // Return cached elevation if valid
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.elevation;
      }

      // Default to sea level
      let elevation = 0;

      try {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locations: [
              {
                latitude: lat,
                longitude: lng
              }
            ]
          })
        });

        if (response.ok) {
          const data: ElevationResponse = await response.json();
          if (data.results?.[0]) {
            elevation = data.results[0].elevation;
          } else {
            console.warn('Invalid elevation response:', data);
          }
        } else {
          console.warn('Failed to fetch elevation data:', response.status);
        }
      } catch (error) {
        console.warn('Failed to fetch elevation data, using sea level:', error);
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        elevation,
        timestamp: Date.now()
      });

      // Convert meters to feet for consistency
      return elevation * 3.28084;
    } catch (error) {
      console.error('Error in elevation service:', error);
      return 0; // Return sea level if anything goes wrong
    }
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const elevationService = ElevationService.getInstance();