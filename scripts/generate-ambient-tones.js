// One-off generator for the two ambient loop tones used by the audio
// crossfade system (core/audioStore.ts + components/AmbientAudioEngine.tsx).
// Run once with `node scripts/generate-ambient-tones.js`; the WAVs are
// committed as static assets, this script doesn't run at app runtime.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_S = 3; // loops seamlessly via zero-crossing-aligned frequencies

function writeWav(filePath, samples) {
  const numFrames = samples.length;
  const bytesPerSample = 2;
  const dataSize = numFrames * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numFrames; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }

  fs.writeFileSync(filePath, buffer);
}

// A gentle fade in/out envelope so the loop point doesn't click.
function envelope(t, duration, fadeS = 0.15) {
  if (t < fadeS) return t / fadeS;
  if (t > duration - fadeS) return (duration - t) / fadeS;
  return 1;
}

function generate({ fundamental, harmonics, amplitude }) {
  const numFrames = SAMPLE_RATE * DURATION_S;
  const samples = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    for (const [mult, weight] of harmonics) {
      value += Math.sin(2 * Math.PI * fundamental * mult * t) * weight;
    }
    samples[i] = value * amplitude * envelope(t, DURATION_S);
  }
  return samples;
}

// "Clear": brighter, more upper harmonic content — an open, alert tone.
const clear = generate({
  fundamental: 220,
  harmonics: [
    [1, 0.5],
    [2, 0.25],
    [3, 0.15],
    [4, 0.1],
  ],
  amplitude: 0.1,
});

// "Muffled": fundamental only, lower and quieter — the acoustic equivalent
// of a low-pass filter dropped over the same base tone.
const muffled = generate({
  fundamental: 220,
  harmonics: [
    [1, 1.0],
    [2, 0.05],
  ],
  amplitude: 0.07,
});

const outDir = path.join(__dirname, '..', 'assets', 'audio');
writeWav(path.join(outDir, 'ambient-clear.wav'), clear);
writeWav(path.join(outDir, 'ambient-muffled.wav'), muffled);
console.log('Wrote ambient-clear.wav and ambient-muffled.wav to', outDir);
