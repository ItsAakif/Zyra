import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { authService } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { EnvironmentService } from '@/lib/environment';

export default function Index() {
  useEffect(() => {
    // Log environment status on app start
    EnvironmentService.logEnvironmentStatus();
    
    let timeoutId: NodeJS.Timeout;
    let redirected = false;

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((authState) => {
      console.log('Auth state in index:', authState);
      
      if (!authState.isLoading && !redirected) {
        redirected = true;
        
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Add a small delay to ensure smooth transition
        timeoutId = setTimeout(() => {
          try {
            if (authState.isAuthenticated) {
              console.log('Redirecting to tabs...');
              router.replace('/(tabs)');
            } else {
              console.log('Redirecting to auth...');
              router.replace('/(auth)/sign-in');
            }
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to tabs
            router.replace('/(tabs)');
          }
        }, Platform.OS === 'android' ? 500 : 200);
      }
    });

    // Fallback timeout in case auth never loads properly
    const fallbackTimeout = setTimeout(() => {
      if (!redirected) {
        console.log('Fallback timeout, redirecting to tabs...');
        redirected = true;
        router.replace('/(tabs)');
      }
    }, 5000);

    return () => {
      unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Show a loading screen while redirecting
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.gradient}
      >
        <Image 
          source={require('@/assets/images/logo_white.png.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoImage: {
    width: 150,
    height: 100,
    marginBottom: 24,
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