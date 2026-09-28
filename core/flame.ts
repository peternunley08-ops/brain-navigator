// The app's one flame, shared by the Breathe instrument and every candle on
// the Desk. Runs on the UI thread and is rebuilt every frame.
//
// The classic teardrop curve — round belly, sharp tip — whose tip sways and
// flickers while the belly stays put, like a real wick. `half` is the
// belly's half-width, `height` how far the tip reaches above the wick,
// `axis` a lean in radians (0 = straight up, + leans right), `wob` how
// alive it is (0 = perfectly still, for Reduce Motion).
export function flamePath(
  cx: number,
  cy: number,
  half: number,
  height: number,
  axis: number,
  t: number,
  wob: number,
  seed: number,
  points = 40
) {
  'worklet';
  const N = points;
  const xs: number[] = [];
  const ys: number[] = [];
  const cosA = Math.cos(axis);
  const sinA = Math.sin(axis);
  const sway =
    wob * (0.16 * Math.sin(t * 0.0029 + seed) + 0.09 * Math.sin(t * 0.0077 + seed * 1.7));
  const flick = 1 + wob * (0.05 * Math.sin(t * 0.011 + seed) + 0.03 * Math.sin(t * 0.023 + seed * 3));
  for (let i = 0; i < N; i++) {
    const s = (i / N) * Math.PI * 2;
    const k = Math.sin(s / 2); // 0 at the tip, 1 at the base of the belly
    const tipness = (1 - k) * (1 - k);
    const edge = 1 + wob * 0.035 * Math.sin(3 * s + t * 0.004 + seed);
    let lx = half * Math.sin(s) * Math.pow(k, 1.15) * edge;
    const c = Math.cos(s);
    const ly = c > 0 ? -height * flick * c : -half * 0.92 * c;
    lx += sway * tipness * half * 1.4;
    xs.push(cx + lx * cosA - ly * sinA);
    ys.push(cy + lx * sinA + ly * cosA);
  }
  let d = `M${((xs[N - 1] + xs[0]) / 2).toFixed(1)},${((ys[N - 1] + ys[0]) / 2).toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    d += `Q${xs[i].toFixed(1)},${ys[i].toFixed(1)} ${((xs[i] + xs[j]) / 2).toFixed(1)},${(
      (ys[i] + ys[j]) /
      2
    ).toFixed(1)}`;
  }
  return d + 'Z';
}

// Lit tints of the brass token, used only inside flames.
export const FLAME_CORE = '#FBF1D6';
export const FLAME_MID = '#D8B36A';
