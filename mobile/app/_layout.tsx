import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';

const AUTH_SCREENS = ['login', 'register', 'verify'];

function RootNavigator() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const onAuthScreen = AUTH_SCREENS.includes(segments[0] as string);
    if (!user && !onAuthScreen) {
      router.replace('/login');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="verify" options={{ headerShown: false }} />
        <Stack.Screen name="qarzdorlar" options={{ title: 'Qarzdorlar', headerBackTitle: 'Orqaga' }} />
        <Stack.Screen name="taminotchilar" options={{ title: "Ta'minotchilar", headerBackTitle: 'Orqaga' }} />
        <Stack.Screen name="xarajatlar" options={{ title: 'Xarajatlar', headerBackTitle: 'Orqaga' }} />
        <Stack.Screen name="hisobotlar" options={{ title: 'Hisobotlar', headerBackTitle: 'Orqaga' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
