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
   * Number of histogram bins.
   * @type {number}
   */
  this.numBins = params.numBins != undefined ? params.numBins : 10;
};

_.inherit(visflow.options.Histogram, visflow.options.Visualization);
