import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime';
import { Lora_400Regular, Lora_500Medium } from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AmbientAudioEngine } from '../components/AmbientAudioEngine';
import { EntryThreshold } from '../components/EntryThreshold';
import { colors } from '../core/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Lora_400Regular,
    Lora_500Medium,
    CourierPrime_400Regular,
  });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AmbientAudioEngine />
      {entered ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      ) : (
        <EntryThreshold onEnter={() => setEntered(true)} />
      )}
    </SafeAreaProvider>
  );
}
