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
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AchievementWatcher } from '../components/AchievementWatcher';
import { EmberBuddy } from '../components/ember/EmberBuddy';
import { EntryThreshold } from '../components/EntryThreshold';
import { ErrorScreen } from '../components/ErrorScreen';
import { UndoBar } from '../components/UndoBar';
import { useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { colors } from '../core/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// A crash in any screen lands here instead of a white screen.
export { ErrorScreen as ErrorBoundary };

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
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.night },
              }}
            />
            <UndoBar />
            {/* Ember floats above every screen. */}
            <EmberBuddy />
            <AchievementWatcher />
          </>
        ) : (
          <EntryThreshold onEnter={() => setEntered(true)} />
        )}
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
