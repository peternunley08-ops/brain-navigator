import { useRef } from 'react';
import type { TextInput } from 'react-native';

// iOS can commit a pending autocorrection just after a chat box is cleared
// ("monday" → "Monday"), which put the sent message back in the box. This
// clears the box on send and drops that echo for a moment after.
export function useClearOnSend(setText: (text: string) => void) {
  const input = useRef<TextInput>(null);
  const sent = useRef<{ text: string; at: number } | null>(null);
  const same = (a: string, b: string) => a.trim().toLowerCase().slice(0, 16) === b.trim().toLowerCase().slice(0, 16);

  const clear = (text: string) => {
    sent.current = { text, at: Date.now() };
    setText('');
  };

  const onChangeText = (text: string) => {
    const s = sent.current;
    if (s && Date.now() - s.at < 1000 && text.trim() && same(text, s.text)) {
      input.current?.clear();
      setText('');
      return;
    }
    setText(text);
  };

  return { input, clear, onChangeText };
}
