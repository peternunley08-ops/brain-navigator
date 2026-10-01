import { useEffect, useState } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

// AI replies sometimes use **bold** and *italics* (Quizzo's questions,
// Sage's "What you nailed:"). Show them as styled text instead of asterisks.
// With `reveal`, the words appear over a moment, about as fast as Ember
// "says" them (instant with Reduce Motion).
export function RichText({ text, style, reveal }: { text: string; style?: StyleProp<TextStyle>; reveal?: boolean }) {
  const reduced = useReducedMotion();
  const words = text.split(/(\s+)/);
  const [shown, setShown] = useState(reveal && !reduced ? 0 : words.length);

  useEffect(() => {
    if (!reveal || reduced) {
      setShown(words.length);
      return;
    }
    setShown(0);
    // The whole reply lands within about two seconds, however long it is.
    const step = Math.max(12, Math.min(45, 2000 / Math.max(1, words.length)));
    const t = setInterval(() => {
      setShown((n) => {
        if (n >= words.length) {
          clearInterval(t);
          return n;
        }
        return n + 2;
      });
    }, step);
    return () => clearInterval(t);
    // Restart only when the text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reveal, reduced]);

  const visible = shown >= words.length ? text : words.slice(0, shown).join('');
  return (
    <Text style={style} accessibilityLabel={text.replace(/\*\*?/g, '')}>
      {parse(visible).map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={{ fontWeight: '700' }}>
            {seg.text}
          </Text>
        ) : seg.italic ? (
          <Text key={i} style={{ fontStyle: 'italic' }}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        )
      )}
    </Text>
  );
}

function parse(text: string) {
  const out: { text: string; bold?: boolean; italic?: boolean }[] = [];
  const re = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    if (m[1]) out.push({ text: m[1], bold: true });
    else out.push({ text: m[2], italic: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
