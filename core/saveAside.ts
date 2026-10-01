import { File, Paths } from 'expo-file-system';

/**
 * A data file that couldn't be read is copied aside (e.g. `life.json.unreadable-1727740800000`)
 * before the app starts fresh, so the next save can never destroy it.
 */
export function saveAside(name: string, text: string) {
  try {
    const f = new File(Paths.document, `${name}.unreadable-${Date.now()}`);
    f.create();
    f.write(text);
  } catch {
    // Nothing more we can do; at least the app still opens.
  }
}
