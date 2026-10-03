import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { useAudioStore } from '../core/audioStore';

const TICK_MS = 30;

// Owns the two looping ambient players and crossfades their volumes toward
// whichever mood core/audioStore.ts currently holds. Mounted once in
// app/_layout.tsx — callers everywhere else just call
// useAudioStore.getState().transitionToMood(...), no player access needed.
export function AmbientAudioEngine() {
  const clearPlayer = useAudioPlayer(require('../assets/audio/ambient-clear.wav'));
  const muffledPlayer = useAudioPlayer(require('../assets/audio/ambient-muffled.wav'));
  const cracklePlayer = useAudioPlayer(require('../assets/audio/crackle.wav'));
  const crackleOn = useAudioStore((s) => !!s.crackle && !!s.crackleLive);
  const mood = useAudioStore((s) => s.mood);
  const transitionMs = useAudioStore((s) => s.transitionMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clearPlayer.loop = true;
    muffledPlayer.loop = true;
    clearPlayer.volume = 1;
    muffledPlayer.volume = 0;
    clearPlayer.play();
    muffledPlayer.play();
  }, [clearPlayer, muffledPlayer]);

  // Soft fire crackle: only while a focus session runs and the student has it on.
  useEffect(() => {
    cracklePlayer.loop = true;
    cracklePlayer.volume = 0.35;
    try {
      if (crackleOn) cracklePlayer.play();
      else cracklePlayer.pause();
    } catch {
      // A player that's gone is already silent.
    }
  }, [crackleOn, cracklePlayer]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const targetClear = mood === 'clear' ? 1 : 0;
    const targetMuffled = mood === 'muffled' ? 1 : 0;
    const startClear = clearPlayer.volume;
    const startMuffled = muffledPlayer.volume;
    const steps = Math.max(1, Math.round(transitionMs / TICK_MS));
    let step = 0;

    intervalRef.current = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / steps);
      clearPlayer.volume = startClear + (targetClear - startClear) * t;
      muffledPlayer.volume = startMuffled + (targetMuffled - startMuffled) * t;
      if (t >= 1 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mood, transitionMs, clearPlayer, muffledPlayer]);

  return null;
}
