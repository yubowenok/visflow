/**
 * Returns a random integer between [0, maxValue).
 */
export const randomInt = (maxValue: number): number => {
  return Math.floor(Math.random() * maxValue);
};

/**
 * Hashes a string using polynomial hashing.
 */
export const hashString = (s: string): number => {
  const A = 3;
  const P = 1000000007;
  let result = 0;
  for (const c of s) {
    result = (result * A + c.charCodeAt(0)) % P;
  }
  return result;
};
