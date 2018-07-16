import { Selection } from 'd3-selection';

export const fadeOut = (obj: Selection<SVGElement, {}, SVGElement, {}>) => {
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
