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
  const $el = $(el);
  const { top, left } = $el.offset() as JQuery.Coordinates;
  const width = $el.width() as number;
  const height = $el.height() as number;
  return x >= left - margin && x <= left + width + margin &&
    y >= top - margin && y <= top + height + margin;
};

/**
 * Gets the offset of an element "e1" relative to another element "e2".
 */
export const elementOffset = (e1: JQuery, e2: JQuery): JQuery.Coordinates => {
  const offset1 = e1.offset() as JQuery.Coordinates;
  const offset2 = e2.offset() as JQuery.Coordinates;
  return {
    left: offset1.left - offset2.left,
    top: offset1.top - offset2.top,
  };
};

/**
 * Gets the offset of a mouse event relative to a given element.
 */
export const mouseOffset = (evt: MouseEvent, e: JQuery): JQuery.Coordinates => {
  const offset = e.offset() as JQuery.Coordinates;
  const paddingLeft = parseInt(e.css('padding-left'), 10);
  const paddingTop = parseInt(e.css('padding-top'), 10);
  return {
    left: evt.pageX - offset.left - paddingLeft,
    top: evt.pageY - offset.top - paddingTop,
  };
};

/**
 * Checks if two boxes (rectangles) are equal.
 */
export const areBoxesEqual = (a: Box, b: Box): boolean => {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
};
