import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { authService } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((authState) => {
      if (!authState.isLoading) {
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Add a small delay to ensure smooth transition
        timeoutId = setTimeout(() => {
          if (authState.isAuthenticated) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/sign-in');
          }
        }, 100);
      }
    });

    // Initial check with fallback timeout
    const authState = authService.getAuthState();
    if (!authState.isLoading) {
      timeoutId = setTimeout(() => {
        if (authState.isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/sign-in');
        }
      }, 100);
    } else {
      // Fallback timeout in case auth never loads
      timeoutId = setTimeout(() => {
        console.log('Auth timeout, redirecting to tabs...');
        router.replace('/(tabs)');
      }, 3000);
    }

    return () => {
      unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Show a loading screen while redirecting
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.appName}>Zyra</Text>
        <Text style={styles.tagline}>Global Payments Made Simple</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: Platform.select({
      ios: 'SpaceGrotesk-Bold',
      android: 'SpaceGrotesk-Bold',
      default: 'sans-serif',
    }),
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    fontFamily: Platform.select({
      ios: 'SpaceGrotesk-Bold',
      android: 'SpaceGrotesk-Bold',
      default: 'sans-serif',
    }),
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'sans-serif',
    }),
  },
});