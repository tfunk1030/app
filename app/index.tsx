/**
 * Root Index - Navigation Router
 *
 * Redirects to either the classic 5-tab navigation or
 * the redesigned 3-tab navigation based on user preference.
 */

import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useNavigationPreference } from '@/src/stores/navigationPreference';

export default function RootIndex() {
  const { style, isLoaded, loadPreference } = useNavigationPreference();

  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  // Wait for preference to load
  if (!isLoaded) {
    return null;
  }

  // Redirect based on navigation style preference
  if (style === 'redesign') {
    return <Redirect href="/(tabs-redesign)" />;
  }

  return <Redirect href="/(tabs)" />;
}
