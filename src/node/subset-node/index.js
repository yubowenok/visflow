/**
 * @fileoverview Subset flow node base class.
 */

/**
 * @param {visflow.params.Node} params
 * @extends {visflow.Node}
 * @abstract
 * @constructor
 */
visflow.SubsetNode = function(params) {
  if (params == null) {
    visflow.error('null params');
    return;
  }
  visflow.SubsetNode.base.constructor.call(this, params);
};

_.inherit(visflow.SubsetNode, visflow.Node);

/** @inheritDoc */
visflow.SubsetNode.prototype.init = function() {
  visflow.SubsetNode.base.init.call(this);
  this.container.addClass('subset');
};

/**
 * Gets input data.
 * @return {!Array<visflow.Data>}
 */
visflow.SubsetNode.prototype.getInputData = function() {
  var data = [];
  for (var id in this.ports) {
    var port = this.ports[id];
    if (port.isInput && !port.isConstants) {
      data.push(port.pack.data);
    }
  }
  return data;
};

/**
 * Gets a data port.
 * @param {string} id
 * @return {!visflow.SubsetPort}
 */
visflow.SubsetNode.prototype.getDataPort = function(id) {
  var port = /** @type {!visflow.SubsetPort} */(this.getPort(id));
  // TODO(bowen): type-check that the port with id is indeed a data port.
  return port;
};

/**
 * Gets the input data port.
 * @return {!visflow.SubsetPort}
 */
visflow.SubsetNode.prototype.getDataInPort = function() {
  return this.getDataPort('in');
};

/**
 * Gets the output data port.
 * @return {!visflow.SubsetPort}
 */
visflow.SubsetNode.prototype.getDataOutPort = function() {
  return this.getDataPort('out');
};
