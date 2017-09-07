/**
 * @fileoverview VisFlow value node base.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.SubsetNode}
 * @abstract
 */
visflow.Value = function(params) {
  visflow.Value.base.constructor.call(this, params);
};

_.inherit(visflow.Value, visflow.SubsetNode);

/** @inheritDoc */
visflow.Value.prototype.init = function() {
  visflow.Value.base.init.call(this);
};

/**
 * Gets the constant output port of the value node.
 * @return {!visflow.ConstantPort}
 */
visflow.Value.prototype.getConstantOutPort = function() {
  return /** @type {!visflow.ConstantPort} */(this.getPort('out'));
};
