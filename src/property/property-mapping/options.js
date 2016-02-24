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
