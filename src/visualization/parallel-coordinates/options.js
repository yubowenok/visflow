/**
 * @fileoverview ParallelCoordinates options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.ParallelCoordinates = function(params) {
  visflow.options.ParallelCoordinates.base.constructor.call(this, params);

  /**
   * Dimensions of parallel coordinates.
   * @type {!Array<number>}
   */
  this.dims = params.dims !== undefined ? params.dims : [];

  /**
   * Show axes ticks.
   * @type {boolean}
   */
  this.ticks = !!params.ticks;

  /**
   * Show axis label.
   * @type {boolean}
   */
  this.axisLabel = !!params.axisLabel;
};

_.inherit(visflow.options.ParallelCoordinates, visflow.options.Visualization);
