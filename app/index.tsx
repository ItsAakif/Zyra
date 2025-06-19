import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Immediately redirect to tabs
    router.replace('/(tabs)');
  }, []);

  return null;
}