/**
 * @fileoverview Histogram options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.Histogram = function(params) {
  visflow.options.Histogram.base.constructor.call(this, params);

  /**
   * Distribution dimension.
   * @type {number}
   */
  this.dim = params.dim !== undefined ? params.dim : 0;

  /**
   * Number of histogram bins.
   * @type {number}
   */
  this.numBins = params.numBins !== undefined ? params.numBins : 10;

  /**
   * Whether to show X axis ticks.
   * @type {boolean}
   */
  this.xTicks = true;

  /**
   * Whether to show Y axis ticks.
   * @type {boolean}
   */
  this.yTicks = true;
};

_.inherit(visflow.options.Histogram, visflow.options.Visualization);
