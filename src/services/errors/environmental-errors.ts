export class EnvironmentalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentalError';
  }
}

export class LocationPermissionError extends EnvironmentalError {
  constructor(message = 'Location permission denied') {
    super(message);
    this.name = 'LocationPermissionError';
  }
}

export class WeatherAPIError extends EnvironmentalError {
  constructor(status: number, message?: string) {
    super(message || `Weather API error: ${status}`);
    this.name = 'WeatherAPIError';
  }
}

export class ValidationError extends EnvironmentalError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CacheError extends EnvironmentalError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class NetworkError extends EnvironmentalError {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends EnvironmentalError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}