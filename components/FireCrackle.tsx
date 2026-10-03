import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { useAudioStore } from '../core/audioStore';

// The soft fire crackle for Focus, on its own player. Silent unless the
// student turned it on and a focus session is running; the chip on Focus is
// the mute. (The older ambient engine stays off: it played on launch with no
// way to stop it.)
export function FireCrackle() {
  const player = useAudioPlayer(require('../assets/audio/crackle.wav'));
  const on = useAudioStore((s) => !!s.crackle && !!s.crackleLive);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.35;
    try {
      if (on) player.play();
      else player.pause();
    } catch {
      // A player that's gone is already silent.
    }
  }, [on, player]);

  return null;
}
