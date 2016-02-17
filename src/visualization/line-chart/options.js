/**
 * @fileoverview LineChart options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.LineChart = function(params) {
  visflow.options.LineChart.base.constructor.call(this, params);

  /**
   * Series dimension.
   * @type {number}
   */
  this.xDim = params.xDim != undefined ? params.xDim : visflow.data.INDEX_DIM;

  /**
   * Group by dimension, must be key.
   * @type {string}
   */
  this.groupBy = params.groupBy != undefined ? params.groupBy : '';

  /**
   * Show points.
   * @type {boolean}
   */
  this.points = !!params.points;

  /**
   * Show legends.
   * @type {boolean}
   */
  this.legends = !!params.legends;

  /**
   * Use curve to draw lines.
   * @type {boolean}
   */
  this.curve = !!params.curve;

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
   * X domain margin.
   * @type {number}
   */
  this.xMargin = params.xMargin != undefined ? params.xMargin : 0.1;

  /**
   * Y domain margin.
   * @type {number}
   */
  this.yMargin = params.yMargin != undefined ? params.yMargin : 0.1;
};

_.inherit(visflow.options.LineChart, visflow.options.Visualization);
