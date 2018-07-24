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
