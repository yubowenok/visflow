/**
 * @fileoverview Scatterplot options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.Scatterplot = function(params) {
  visflow.options.Scatterplot.base.constructor.call(this, params);

  /**
   * X Dimension.
   * @type {number}
   */
  this.xDim = params.xDim !== undefined ? params.xDim : 0;

  /**
   * Y dimension.
   * @type {number}
   */
  this.yDim = params.yDim !== undefined ? params.yDim : 0;

  /**
   * Show x-axis ticks.
   * @type {boolean}
   */
  this.xTicks = !!params.xTicks;

  /**
   * Show y-axis ticks.
   * @type {boolean}
   */
  this.yTicks = !!params.yTicks;

  /**
   * Margin percentage of x.
   * @type {number}
   */
  this.xMargin = params.xMargin !== undefined ? params.xMargin : 0.1;

  /**
   * Margin percentage of y.
   * @type {number}
   */
  this.yMargin = params.yMargin !== undefined ? params.yMargin : 0.1;
};

_.inherit(visflow.options.Scatterplot, visflow.options.Visualization);
