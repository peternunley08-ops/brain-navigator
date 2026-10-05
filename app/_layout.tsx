import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AchievementWatcher } from '../components/AchievementWatcher';
import { BottomNav } from '../components/BottomNav';
import { EmberBuddy } from '../components/ember/EmberBuddy';
import { EntryThreshold } from '../components/EntryThreshold';
import { ErrorScreen } from '../components/ErrorScreen';
import { PrivacyVeil } from '../components/PrivacyVeil';
import { OpenWatcher } from '../components/OpenWatcher';
import { ShowBanner } from '../components/ShowBanner';
import { ShowTour } from '../components/ShowTour';
import { FireCrackle } from '../components/FireCrackle';
import { ShakeToWorry } from '../components/ShakeToWorry';
import { UndoBar } from '../components/UndoBar';
import { Celebration } from '../components/Celebration';
import { useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { colors } from '../core/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// A crash in any screen lands here instead of a white screen.
export { ErrorScreen as ErrorBoundary };

// A development-only warning from inside a library's native animations (not
// this app's code, and absent from release builds); hiding it keeps the
// dev toast for warnings that matter.
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered']);

// Quick-add pages: a full-height iOS sheet with a grabber to pull it down.
const SHEET = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 28,
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // School data lives on the phone; read it once at launch.
  useEffect(() => {
    useSchoolStore.getState().load();
    useHubStore.getState().load();
    useLifeStore.getState().load();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {/* AmbientAudioEngine (components/AmbientAudioEngine.tsx) disabled:
            it looped ambient audio starting immediately on launch, before
            the entry gate, with no way to silence it from the UI. Left the
            component and core/audioStore.ts in place — transitionToMood()
            calls elsewhere are now harmless no-ops — so this is easy to
            revisit if ambient audio is wanted again with an actual mute
            control. */}
        {entered ? (
          <>
            <FireCrackle />
            <ShakeToWorry />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.night },
                // Swipe back from anywhere on the page, not just the edge.
                fullScreenGestureEnabled: true,
              }}
            >
              {/* Adding and editing slide up as iOS sheets with a grabber, so
                  it's clear they're a quick detour from the screen underneath. */}
              <Stack.Screen name="add-assignment" options={SHEET} />
              <Stack.Screen name="class-edit" options={SHEET} />
              <Stack.Screen name="new-entry" options={SHEET} />
              <Stack.Screen name="pocket-worry" options={SHEET} />
              <Stack.Screen name="ai-consent" options={SHEET} />
              {/* Your day swipes between days, so back stays on the edge there. */}
              <Stack.Screen name="today" options={{ fullScreenGestureEnabled: false }} />
            </Stack>
            {/* One nav for the whole app; pages say whether they want it. */}
            <BottomNav />
            <UndoBar />
            {/* Ember floats above every screen. */}
            <EmberBuddy />
            <AchievementWatcher />
            <OpenWatcher />
            <Celebration />
            <ShowBanner />
            <ShowTour />
          </>
        ) : (
          <EntryThreshold onEnter={() => setEntered(true)} />
        )}
        <PrivacyVeil />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
  },
});
