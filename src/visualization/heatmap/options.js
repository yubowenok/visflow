/**
 * @fileoverview Heatmap options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.Heatmap = function(params) {
  visflow.options.Heatmap.base.constructor.call(this, params);

  /**
   * Id corresponding to the id of visflow.scales.
   * @type {string}
   */
  this.colorScaleId = params.colorScaleId !== undefined ?
    params.colorScaleId : 'redGreen';

  /**
   * By which column value shall the rows be sorted.
   * @type {number}
   */
  this.sortBy = params.sortBy !== undefined ? params.sortBy : 0;

  /**
   * By which column value shall the rows be labeled. If this is empty string,
   * then show no row label.
   * @type {number}
   */
  this.labelBy = params.labelBy !== undefined ? params.labelBy : 0;

  /**
   * Whether to show column label.
   * @type {boolean}
   */
  this.colLabel = !!params.colLabel;
};

_.inherit(visflow.options.Heatmap, visflow.options.Visualization);
