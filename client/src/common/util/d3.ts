import { Selection, BaseType } from 'd3-selection';

/**
 * Provides D3 fade out on any selected element.
 */
export const fadeOut = <GElement extends BaseType, Datum, PElement extends BaseType, PDatum>
  (obj: Selection<GElement, Datum, PElement, PDatum>) => {
  obj.transition()
    .style('opacity', 0)
    .remove();
};

export const getTransform = (translate?: [number, number], scale?: number, rotate?: number): string => {
  let result = '';
  if (translate !== undefined) {
    result += 'translate(' + translate + ')';
  }
  if (scale !== undefined) {
    result += 'scale(' + scale + ')';
  }
  if (rotate !== undefined) {
    result += 'rotate(' + rotate + ')';
  }
  return result;
};


const FLOAT_TOLERANCE = 1e-9;

/**
 * Returns if point r and s are on two sides of line (p, q).
 */
const areOnTwoSides = (p: Point, q: Point, r: Point, s: Point): boolean => {
  const a = q.y - p.y;
  const b = p.x - q.x;
  const c = q.x * p.y - q.y * p.x;
  const v1 = a * r.x + b * r.y + c;
  const v2 = a * s.x + b * s.y + c;
  if (Math.abs(v1) < FLOAT_TOLERANCE || Math.abs(v2) < FLOAT_TOLERANCE) {
    return true;
  }
  return v1 * v2 < 0;
};

/**
 * Returns if segment (p, q) intersects segment (r, s).
 */
export const areSegmentsIntersected = (p: Point, q: Point, r: Point, s: Point): boolean => {
  return areOnTwoSides(p, q, r, s) && areOnTwoSides(r, s, p, q);
};

/**
 * Returns if two ranges intersect.
 */
export const areRangesIntersected = (p: [number, number], q: [number, number]): boolean => {
  return p[0] <= q[1] && p[1] >= q[0];
};

/**
 * Returns if the two given boxes intersect.
 */
export const areBoxesIntersected = (a: Box, b: Box): boolean => {
  return areRangesIntersected([a.x, a.x + a.width], [b.x, b.x + b.width]) &&
    areRangesIntersected([a.y, a.y + a.height], [b.y, b.y + b.height]);
};
