import { requireOptionalNativeModule } from 'expo-modules-core';

export interface RecognizedLine {
  text: string;
  confidence: number;
  /** Box in 0–1 image coordinates, from the top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextRecognitionNative {
  recognize(uri: string): Promise<RecognizedLine[]>;
}

// Null when the app was built before this module existed — callers fall
// back to pasting text instead.
const native = requireOptionalNativeModule<TextRecognitionNative>('TextRecognition');

export const textRecognitionAvailable = native != null;

export async function recognizeText(uri: string): Promise<RecognizedLine[]> {
  if (!native) throw new Error('Text recognition isn’t in this build of the app yet.');
  return native.recognize(uri);
}
