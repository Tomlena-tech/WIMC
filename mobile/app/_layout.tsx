import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { isAuthenticated } from '@/services/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [loaded]);

  // ✅ UN SEUL useEffect pour auth + navigation
  useEffect(() => {
    const handleNavigation = async () => {
      if (!isReady) return;

      // 1. Vérifier l'auth
      const authenticated = await isAuthenticated();
      console.log('🔍 Auth:', authenticated, 'Segments:', segments);
      
      // 2. Mettre à jour l'état
      setIsLoggedIn(authenticated);
      
      // 3. Naviguer immédiatement
      const inAuthGroup = segments[0] === '(tabs)';
      
      if (!authenticated && inAuthGroup) {
        console.log('➡️ → Login');
        router.replace('/login');
      } else if (authenticated && !inAuthGroup && segments[0] !== 'login' && segments[0] !== 'child-history' && segments[0] !== 'add-child') {
        console.log('➡️ → App');
        router.replace('/(tabs)');
      }
    };

    handleNavigation();
  }, [segments, isReady]);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="child-history" options={{ headerShown: false }} />
        <Stack.Screen name="add-child" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
