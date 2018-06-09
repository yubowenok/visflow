import $ from 'jquery';

/**
 * Returns true if the element contains a given point.
 * The point must be specified in coordinates relative to the element.
 * x-axis goes from left to right.
 * y-axis goes from top to bottom.
 * @param margin specifies the number of extra pixels allowed around the bounding box of el.
 */
export const elementContains = (el: Element | JQuery, x: number, y: number, margin?: number): boolean => {
  margin = margin || 0;
  const { top, left } = $(el).position();
  const width = $(el).width() as number;
  const height = $(el).height() as number;
  return x >= left - margin && x <= left + width + margin &&
    y >= top - margin && y <= top + height + margin;
};
