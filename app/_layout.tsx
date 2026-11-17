import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EventsProvider } from '@/store/events';
import { HallsProvider } from '@/store/halls';
import { LinksProvider } from '@/store/links';
import { ShoppingProvider } from '@/store/shopping';
import { UploadsProvider } from '@/store/uploads';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <EventsProvider>
          <HallsProvider>
            <UploadsProvider>
              <ShoppingProvider>
                <LinksProvider>
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
                    <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="hall" options={{ presentation: 'modal' }} />
                  </Stack>
                </LinksProvider>
              </ShoppingProvider>
            </UploadsProvider>
          </HallsProvider>
        </EventsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
