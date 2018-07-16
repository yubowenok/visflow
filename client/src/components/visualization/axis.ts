import { select, Selection } from 'd3-selection';
import { axisTop, axisBottom, axisLeft, axisRight, Axis, AxisScale, AxisDomain } from 'd3-axis';
import { Scale } from './scale';

export interface DrawAxisOptions {
  orient: 'top' | 'bottom' | 'left' | 'right';
  ticks?: number; // zero means no ticks
  transform?: string; // transform applied on the entire axis
  classes?: string; // CSS classes added to the SVG group
  label?: {
    text: string,
    transform: string, // transform applied on the axis label, relative to the axis group
  };
}

const DEFAULT_AXIS_TICKS = 5;

/**
 * Draws an axis with a column label.
 */
export const drawAxis = (svg: SVGElement, scale: Scale, options: DrawAxisOptions) => {
  let axis: Axis<AxisDomain>;
  switch (options.orient) {
    case 'top':
      axis = axisTop(scale);
      break;
    case 'bottom':
      axis = axisBottom(scale);
      break;
    case 'left':
      axis = axisLeft(scale);
      break;
    case 'right':
      axis = axisRight(scale);
      break;
    default:
      console.error(`invalid axis orient ${options.orient}`);
      return;
  }
  axis.ticks(options.ticks || DEFAULT_AXIS_TICKS);
  if (options.ticks === 0) {
    axis.tickValues([]);
  }
  let svgAxes: Selection<SVGGElement, {}, null, undefined> = select(svg).select('g');
  if (svgAxes.empty()) {
    svgAxes = (select(svg).append('g') as Selection<SVGGElement, {}, null, undefined>)
      .classed(options.classes || '', true);
  } else {
    svgAxes.selectAll('*').remove();
  }
  const transform = options.transform || '';
  svgAxes
    .attr('transform', transform)
    .call(axis);

  if (options.label) {
    let svgLabel = svgAxes.select('.label');
    if (svgLabel.empty()) {
      svgLabel = svgAxes.append('text')
        .classed('label', true);
    }
    const labelTransform = options.label.transform || '';
    svgLabel
      .text(options.label.text)
      .attr('transform', labelTransform);
  }
};
