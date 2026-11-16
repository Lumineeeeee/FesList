import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EventsProvider } from '@/store/events';
import { ShoppingProvider } from '@/store/shopping';
import { UploadsProvider } from '@/store/uploads';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <EventsProvider>
        <UploadsProvider>
          <ShoppingProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="booth/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
              <Stack.Screen name="edit-item" options={{ presentation: 'modal' }} />
              <Stack.Screen name="events" options={{ presentation: 'modal' }} />
            </Stack>
          </ShoppingProvider>
        </UploadsProvider>
      </EventsProvider>
    </SafeAreaProvider>
  );
}
