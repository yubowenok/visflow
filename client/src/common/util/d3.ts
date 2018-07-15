import { Selection } from 'd3-selection';

export const fadeOut = (obj: Selection<SVGElement, {}, SVGElement, {}>) => {
  obj.transition()
    .style('opacity', 0)
    .remove();
};
