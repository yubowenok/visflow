/**
 * @fileoverview ValueExtractor Options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.ValueExtractor = function(params) {
  visflow.options.ValueExtractor.base.constructor.call(this, params);

  /**
   * Dimensions from which to extract values.
   * @type {!Array<number>}
   */
  this.dims = params.dims != undefined ? params.dims : [];
};

_.inherit(visflow.options.ValueExtractor, visflow.options.Node);
