/**
 * @fileoverview Property mapping options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.PropertyMapping = function(params) {
  visflow.options.PropertyMapping.base.constructor.call(this, params);
  /**
   * Dimension to be mapped.
   * @type {number}
   */
  this.dim = params.dim !== undefined ? params.dim : 0;

  /**
   * @type {!Array<number>}
   */
  this.numberRange = params.numberRange !== undefined ?
    params.numberRange : [0, 1];

  /**
   * @type {string}
   */
  this.mapping = params.mapping !== undefined ? params.mapping : 'color';

  /**
   * @type {string}
   */
  this.colorScaleId = params.colorScaleId !== undefined ?
    params.colorScaleId : 'redGreen';
};

_.inherit(visflow.options.PropertyMapping, visflow.options.Node);
