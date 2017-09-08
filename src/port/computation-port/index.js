/**
 * @fileoverview VisFlow computation port.
 */

/**
 * @param {visflow.params.Port} params
 * @constructor
 * @extends {visflow.Port}
 */
visflow.ComputationPort = function(params) {
  var paramsApplied = _.extend(
    {
      isInput: false,
      text: 'computation port'
    },
    params
  );

  visflow.ComputationPort.base.constructor.call(this, paramsApplied);

  /**
   * If input is set, this is a copy of the input subset. Otherwise, the value
   * has no meaning.
   * @type {!visflow.Subset}
   */
  this.pack = new visflow.Subset();
};

_.inherit(visflow.ComputationPort, visflow.Port);

/** @const {boolean} */
visflow.ComputationPort.prototype.IS_COMPUTATION_PORT = true;

/** @inheritDoc */
visflow.ComputationPort.prototype.setContainer = function(container) {
  visflow.ComputationPort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('computation');
};

/** @inheritDoc */
visflow.ComputationPort.prototype.connectable = function(port) {
  var result = visflow.ComputationPort.base.connectable.call(this, port);

  if (!result.connectable) {
    // already failed due to graph topology
    return result;
  }
  if (port.IS_CONSTANT_PORT) {
    return {
      connectable: false,
      reason: 'cannot connect ComputationPort to ConstantPort'
    };
  }
  // computation port can connect to anything
  return result;
};

/** @inheritDoc */
visflow.ComputationPort.prototype.getSubset = function() {
  return this.node.getPortSubset(this.id);
};

/** @inheritDoc */
visflow.ComputationPort.prototype.info = function() {
  var subset = this.getSubset();
  if (subset == null) {
    return 'generic data';
  }
  return '(' + subset.count() + ' items)';
};

/** @inheritDoc */
visflow.ComputationPort.prototype.onConnected = function(edge) {
  if (this.isInput) {
    if (edge.sourcePort.IS_SUBSET_PORT) {
      this.pack = edge.sourcePort.getSubset();
    }
  }
  edge.sourcePort.changed(true);
};
