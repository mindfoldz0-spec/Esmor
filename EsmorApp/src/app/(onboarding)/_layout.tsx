import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';
import { OnboardingProvider } from '@/providers/onboarding-provider';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Brand.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="language" options={{ animation: 'fade' }} />
        <Stack.Screen name="details" />
        <Stack.Screen name="location" />
        <Stack.Screen name="gender" />
        <Stack.Screen name="role" />
      </Stack>
    </OnboardingProvider>
  );
}
