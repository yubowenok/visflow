/**
 * @fileoverview Map options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.Map = function(params) {
  visflow.options.Map.base.constructor.call(this, params);

  /**
   * Latitude dimension.
   * @type {number}
   */
  this.latDim = params.latDim !== undefined ? params.latDim : 0;

  /**
   * Longitude dimension.
   * @type {number}
   */
  this.lonDim = params.lonDim !== undefined ? params.lonDim : 0;

  /**
   * Whether to use heatmap.
   * @type {boolean}
   */
  this.heatmap = params.heatmap !== undefined ? params.heatmap : false;

  /**
   * Map view center
   * @type {visflow.Vector}
   */
  this.center = params.center !== undefined ? params.center : [40.729, -73.988];

  /**
   * Map zoom level
   * @type {number}
   */
  this.zoom = params.zoom !== undefined ? params.zoom : 12;

  /**
   * Whether in navigation mode or in selection mode.
   * @type {boolean}
   */
  this.navigation = params.navigation !== undefined ? params.navigation : true;
};

_.inherit(visflow.options.Map, visflow.options.Visualization);
