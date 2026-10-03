// One-off generator for assets/audio/crackle.wav, the soft fire crackle that
// can play during Focus (components/AmbientAudioEngine.tsx). Run once with
// `node scripts/generate-crackle.js`; the WAV is committed as a static asset.
// A low brown-noise bed plus sparse short pops, 24 s, mono 22.05 kHz, 16-bit.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const DURATION_S = 24;
const N = SAMPLE_RATE * DURATION_S;
const XFADE = SAMPLE_RATE * 2; // the loop seam is a 2 s equal-power crossfade

// Seeded so the file is reproducible.
let seed = 20260922;
const rand = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

// Brown noise (leaky integrated white noise), longer than the loop so the tail can fade into the head.
const raw = new Float32Array(N + XFADE);
let last = 0;
for (let i = 0; i < raw.length; i++) {
  last = (last + (rand() * 2 - 1) * 0.04) * 0.998;
  raw[i] = last;
}
let peak = 0;
for (let i = 0; i < raw.length; i++) peak = Math.max(peak, Math.abs(raw[i]));
const bed = new Float32Array(N);
for (let i = 0; i < N; i++) {
  let v = raw[i];
  if (i < XFADE) {
    const t = i / XFADE;
    v = raw[i] * Math.sin((t * Math.PI) / 2) + raw[N + i] * Math.cos((t * Math.PI) / 2);
  }
  bed[i] = (v / peak) * 0.22;
}

// Sparse pops: a few ms of decaying, slightly high-passed noise. Added circularly so the seam stays clean.
const out = Float32Array.from(bed);
let t = 0.3;
while (t < DURATION_S) {
  const at = Math.floor(t * SAMPLE_RATE);
  const len = Math.floor(SAMPLE_RATE * (0.004 + rand() * 0.016));
  const amp = 0.12 + rand() * 0.4;
  const decay = 4 + rand() * 6;
  let prev = 0;
  for (let k = 0; k < len; k++) {
    const w = rand() * 2 - 1;
    const hp = w - prev * 0.6;
    prev = w;
    out[(at + k) % N] += hp * amp * Math.exp((-decay * k) / len);
  }
  // Occasionally a quick double-crackle.
  t += rand() < 0.25 ? 0.05 + rand() * 0.08 : 0.25 + rand() * 1.6;
}

writeWav(path.join(__dirname, '..', 'assets', 'audio', 'crackle.wav'), out);
console.log('Wrote crackle.wav', (44 + N * 2) / 1024 / 1024, 'MB');
