/**
 * Root Index - Navigation Router
 *
 * Redirects to the redesigned 3-tab navigation.
 */

import { Redirect } from 'expo-router';

export default function RootIndex() {
  return <Redirect href="/(tabs-redesign)" />;
}
