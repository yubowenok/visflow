import Victor from 'victor';

/**
 * Gets the mirrored point of p, with respect to the line (lp1, lp2).
 * The distance of the mirrored point will be k times of the distance
 * from p to (lp1, lp2).
 */
export const mirrorPoint = (p: Victor, lp1: Victor, lp2: Victor): Victor => {
  const lineVector = lp2.clone().subtract(lp1).normalize();
  const projectedOffset = p.clone().subtract(lp1).dot(lineVector);
  const d = lineVector.clone().multiplyScalar(projectedOffset);
  const m = lp1.clone().add(d);
  const offset = m.clone().subtract(p);
  return m.add(offset);
};

/**
 * Return the length of the difference between two 2D vectors. The vectors can be given either by an array or by a
 * Point object.
 */
export const vectorDistance = (p: [number, number] | Point, q: [number, number] | Point): number => {
  if (!(p instanceof Array)) {
    p = [(p as Point).x, (p as Point).y];
  }
  if (!(q instanceof Array)) {
    q = [(q as Point).x, (q as Point).y];
  }
  return new Victor(p[0], p[1]).subtract(new Victor(q[0], q[1])).length();
};
