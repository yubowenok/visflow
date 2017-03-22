/**
 * @fileoverview VisFlow value node base.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Node}
 * @abstract
 */
visflow.Value = function(params) {
  visflow.Value.base.constructor.call(this, params);
};

_.inherit(visflow.Value, visflow.Node);

/** @inheritDoc */
visflow.Value.prototype.init = function() {
  visflow.Value.base.init.call(this);
};

/**
 * Gets the constant output port of the value node.
 * @return {!visflow.Port}
 */
visflow.Value.prototype.getConstantOutPort = function() {
  return this.ports['out'];
};
