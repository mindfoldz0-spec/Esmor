import { DefaultTheme, Stack, ThemeProvider, useRouter, type Href } from 'expo-router';
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

SplashScreen.preventAutoHideAsync();

/**
 * A notification can carry a route in its data payload. When the user taps
 * it, the app opens that screen.
 */
function NotificationRouteListener() {
  const router = useRouter();
  const { pendingRoute, consumePendingRoute } = useNotifications();

  useEffect(() => {
    if (!pendingRoute) {
      return;
    }

    // Only in-app routes are allowed, so a push can never open an outside URL.
    if (!pendingRoute.startsWith('/') || pendingRoute.startsWith('//')) {
      consumePendingRoute();
      return;
    }

    consumePendingRoute();
    router.push(pendingRoute as Href);
  }, [pendingRoute, consumePendingRoute, router]);

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
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.background },
      }}>
      <Stack.Protected guard={Boolean(profile)} redirectTo="/language">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Protected guard={!profile} redirectTo="/">
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AppDataProvider>
        <NotificationProvider>
          <ThemeProvider value={DefaultTheme}>
            <AnimatedSplashOverlay />
            <StatusBar style="dark" />
            <NotificationRouteListener />
            <RootNavigator />
          </ThemeProvider>
        </NotificationProvider>
      </AppDataProvider>
    </LanguageProvider>
  );
}
