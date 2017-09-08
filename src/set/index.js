/**
 * @fileoverview VisFlow set base module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.SubsetNode}
 */
visflow.Set = function(params) {
  visflow.Set.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.MultiSubsetPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };

  /**
   * Stores the number of connections seen last time. If this has changed,
   * then in ports must have changed. So we can skip an inPortsChanged scan.
   * @private {number}
   */
  this.numConnections_ = 0;
};

_.inherit(visflow.Set, visflow.SubsetNode);

/** @inheritDoc */
visflow.Set.prototype.init = function() {
  visflow.Set.base.init.call(this);
  this.container.addClass('set');
};

/**
 * Handles in port change event. This may be because of removed connections.
 * @return {boolean}
 */
visflow.Set.prototype.inPortsChanged = function() {
  if (this.numConnections_ != this.getDataInPort().connections.length) {
    this.numConnections_ = this.getDataInPort().connections.length;
    return true;
  }
  return visflow.Set.base.inPortsChanged.call(this);
};

/** @inheritDoc */
visflow.Set.prototype.show = function() {
  visflow.Set.base.show.call(this);
  this.showIcon();
};

/**
 * Finds the data input port for the second operand of the node.
 * For sets other than minus, this should be the same port as getDataInPort().
 * @return {!visflow.Port}
 */
visflow.Set.prototype.getSecondDataInPort = function() {
  return this.getDataInPort();
};
