/** Unbiased random integer in [0, max) using the Web Crypto API. */
export function randomBelow(max: number): number {
  if (max <= 1) return 0;
  if (max > 2 ** 32) return Math.floor(randomFloat() * max);
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/** Random integer in [min, max], inclusive. */
export function randomInt(min: number, max: number): number {
  return min + randomBelow(max - min + 1);
}

/** Random float in [0, 1) with 53 bits of precision. */
export function randomFloat(): number {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return (buf[0] * 2 ** 21 + (buf[1] >>> 11)) / 2 ** 53;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
