import { select } from 'd3-selection';
import { line } from 'd3-shape';
import _ from 'lodash';

export const isPointInBox = (p: Point, b: Box): boolean => {
  return b.x <= p.x && p.x <= b.x + b.width &&
    b.y <= p.y && p.y <= b.y + b.height;
};

export const getBrushBox = (brushPoints: Point[]): Box => {
  const p = _.first(brushPoints) as Point;
  const q = _.last(brushPoints) as Point;
  const x1 = Math.min(p.x, q.x);
  const y1 = Math.min(p.y, q.y);
  const x2 = Math.max(p.x, q.x);
  const y2 = Math.max(p.y, q.y);
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
};

export const drawBrushBox = (svg: SVGElement, brushPoints: Point[]) => {
  select(svg).select('.brush-box').remove();
  const box = select(svg).append('rect')
    .classed('brush-box', true);
  if (!brushPoints.length) {
    return;
  }
  const attrs = getBrushBox(brushPoints);
  box
    .attr('x', attrs.x)
    .attr('y', attrs.y)
    .attr('width', attrs.width)
    .attr('height', attrs.height);
};

export const drawBrushLasso = (svg: SVGElement, brushPoints: Point[]) => {
  const l = line<Point>()
    .x(d => d.x)
    .y(d => d.y);

  select(svg).select('.lasso').remove();
  select(svg).append('path')
    .classed('lasso', true)
    .attr('d', l(brushPoints) as string);
};
