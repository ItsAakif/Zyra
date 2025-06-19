import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { authService, AuthState } from '@/lib/auth';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    algorandAccount: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const hideSplashScreen = async () => {
      try {
        if ((fontsLoaded || fontError) && !authState.isLoading) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    hideSplashScreen();
  }, [fontsLoaded, fontError, authState.isLoading]);

  // Show loading screen while fonts and auth are loading
  if ((!fontsLoaded && !fontError) || authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          style={styles.loadingGradient}
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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
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