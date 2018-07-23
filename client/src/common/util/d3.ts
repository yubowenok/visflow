import { Selection } from 'd3-selection';

// tslint:disable-next-line no-any
export const fadeOut = (obj: Selection<SVGGraphicsElement, any, SVGGElement | null, any>) => {
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
