declare module 'react-native-compass-heading' {
  export interface CompassHeadingData {
    heading: number;
    accuracy?: number;
  }

  const CompassHeading: {
    /**
     * Start compass heading updates
     * @param interval Update interval in milliseconds
     * @param callback Function to call with heading updates
     * @returns Subscription object
     */
    start: (
      interval: number,
      callback: (data: CompassHeadingData) => void
    ) => any;

    /**
     * Stop compass heading updates
     */
    stop: () => void;
  };

  export default CompassHeading;
}
