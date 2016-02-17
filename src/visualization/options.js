/**
 * @fileoverview Visualization options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.Visualization = function(params) {
  visflow.options.Visualization.base.constructor.call(this, params);
};

_.inherit(visflow.options.Visualization, visflow.options.Node);
