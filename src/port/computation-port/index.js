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
  // computation port can connect to anything
  return result;
};
