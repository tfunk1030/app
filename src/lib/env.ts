// For React Native, use a config file instead of dotenv
export const ENV = {
  API_KEY: process.env.API_KEY || 'mobile-default-key',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development'
} as const;
