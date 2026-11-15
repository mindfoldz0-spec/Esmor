import { DefaultTheme, Stack, ThemeProvider, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BootScreen } from '@/components/boot-screen';
import { Brand } from '@/constants/theme';
import { LanguageProvider } from '@/i18n';
import { AppDataProvider, useAppData } from '@/providers/app-data-provider';
import {
  NotificationProvider,
  useNotifications,
} from '@/providers/notification-provider';
import { VoiceProvider } from '@/providers/voice-provider';

SplashScreen.preventAutoHideAsync();

/**
 * A notification can carry a route in its data payload. When the user taps
 * it, the app opens that screen once app data is ready and the navigator is mounted.
 */
function NotificationRouteListener() {
  const router = useRouter();
  const { pendingRoute, consumePendingRoute } = useNotifications();
  const { ready, profile } = useAppData();

  useEffect(() => {
    if (!ready || !pendingRoute) {
      return;
    }

    // Only in-app routes are allowed, so a push can never open an outside URL.
    if (!pendingRoute.startsWith('/') || pendingRoute.startsWith('//')) {
      consumePendingRoute();
      return;
    }

    // If the user has no profile yet, do not navigate to protected screens
    const isProtected = !pendingRoute.startsWith('/(onboarding)') && pendingRoute !== '/language';
    if (!profile && isProtected) {
      consumePendingRoute();
      return;
    }

    const targetRoute = pendingRoute;
    consumePendingRoute();

    // Defer navigation slightly so the root layout and navigator are fully mounted
    const timer = setTimeout(() => {
      router.push(targetRoute as Href);
    }, 150);

    return () => clearTimeout(timer);
  }, [ready, profile, pendingRoute, consumePendingRoute, router]);

  return null;
}

/**
 * Ensures a cold-launch without a profile cleanly redirects to the onboarding
 * flow instead of landing on Expo Router's unmatched route screen.
 */
function AuthProtectionListener() {
  const { ready, profile } = useAppData();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const inOnboarding = segments[0] === '(onboarding)';

    // If no profile and not currently inside onboarding flow, redirect to language selection
    if (!profile && !inOnboarding) {
      router.replace('/(onboarding)/language' as Href);
    }
  }, [ready, profile, segments, router]);

  return null;
}

function RootNavigator() {
  const { ready, profile } = useAppData();

  // Show a quiet boot screen until the local profile has been read, so the
  // first screen never flashes for a returning user.
  if (!ready) {
    return <BootScreen />;
  }

  return (
    <Stack
      initialRouteName={profile ? '(tabs)' : '(onboarding)'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.background },
      }}>
      <Stack.Protected guard={Boolean(profile)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="orders" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Protected guard={!profile}>
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <VoiceProvider>
        <AppDataProvider>
          <NotificationProvider>
            <ThemeProvider value={DefaultTheme}>
              <AnimatedSplashOverlay />
              <StatusBar style="dark" />
              <AuthProtectionListener />
              <NotificationRouteListener />
              <RootNavigator />
            </ThemeProvider>
          </NotificationProvider>
        </AppDataProvider>
      </VoiceProvider>
    </LanguageProvider>
  );
}
