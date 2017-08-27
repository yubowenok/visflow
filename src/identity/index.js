/**
 * @fileoverview An identity computation node that simply copies its input data
 * to its output. This is to test the system's capability of treating each
 * computation node's output as unique data types.
 */

/**
 * @param {!Object} params
 * @constructor
 * @abstract
 * @extends {visflow.ComputationNode}
 */
visflow.Identity = function(params) {
  visflow.Identity.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.ComputationPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.ComputationPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };
};

_.inherit(visflow.Identity, visflow.ComputationNode);


/** @inheritDoc */
visflow.Identity.prototype.init = function() {
  visflow.Identity.base.init.call(this);
};

/**
 * Serializes the compute node.
 * @return {!Object}
 */
visflow.Identity.prototype.serialize = function() {
  var result = visflow.Identity.base.serialize.call(this);
  //_.extend(result, {});
  return result;
};

/**
 * Deserializes the compute node.
 * @param {!Object} save
 */
visflow.Identity.prototype.deserialize = function(save) {
  visflow.Identity.base.deserialize.call(this, save);
  this.fillOptions(this.options, this.identityOptions());
};

/** @inheritDoc */
visflow.Identity.prototype.processAsync = function() {};
