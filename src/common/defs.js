/**
 * @fileoverview Visflow type defs.
 */

/**
 * @typedef {{
 *   left: number,
 *   right: number,
 *   top: number,
 *   bottom: number
 * }}
 */
visflow.Margins;

/**
 * @typedef {{
 *   left: number,
 *   top: number,
 *   width: number,
 *   height: number
 * }}
 */
visflow.Box;

/**
 * @typedef {{
 *   x: number,
 *   y: number
 * }}
 */
visflow.Point;

/**
 * @typedef {{
 *   x1: number,
 *   y1: number,
 *   x2: number,
 *   y2: number
 * }}
 */
visflow.Rect2Points;

/**
 * @typedef {{
 *   left: number,
 *   top: number
 * }}
 */
visflow.Offset;

/**
 * @typedef {!Array<number>} Vector
 */
visflow.Vector;

/**
 * @typedef {!Object<string|number>}
 */
visflow.Properties;

/**
 * @typedef {!Object<number>}
 */
visflow.Multiplier;

/**
 * @typedef {string}
 */
visflow.Transform;
