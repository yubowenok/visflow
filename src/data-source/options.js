/**
 * @fileoverview Data source options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.DataSource = function(params) {
  visflow.options.DataSource.base.constructor.call(this, params);

  /**
   * Whether to use data crossing.
   * @type {boolean}
   */
  this.crossing = !!params.crossing;

  /**
   * Name for the attribute column in crossing.
   * @type {string}
   */
  this.crossingName = params.crossingName != undefined ?
    params.crossingName : 'attributes';

  /**
   * Dimensions used for crossing. -1 is index (visflow.data.INDEX_DIM).
   * @type {!Array<number>}
   */
  this.crossingKeys = params.crossingKeys != undefined ?
    params.crossingKeys : [];

  /**
   * Crossing attributes, in dimension indices.
   * @type {!Array<number>}
   */
  this.crossingAttrs = params.crossingAttrs != undefined ?
    params.crossingAttrs : [];

  /**
   * Whether to user server data set in the UI.
   * @type {boolean}
   */
  this.useServerData = !!params.useServerData;
};

_.inherit(visflow.options.DataSource, visflow.options.Node);
