import { Redirect } from 'expo-router';

export default function Index() {
  // This will redirect to the appropriate route based on auth state
  // The _layout.tsx handles the actual routing logic
  return <Redirect href="/(tabs)" />;
}