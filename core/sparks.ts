// Sparks earned by checking things off anywhere. They wait here (in memory
// only) until the Desk is next in view, then fly to its candles.

let pending = 0;

export function addSpark(n = 1): void {
  if (n > 0) pending += n;
}

/** Returns the waiting sparks and resets the count. */
export function takeSparks(): number {
  const n = pending;
  pending = 0;
  return n;
}
