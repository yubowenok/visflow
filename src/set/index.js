/**
 * @fileoverview VisFlow set base module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Set = function(params) {
  visflow.Set.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.MultiplePort({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    'out': new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };

  /**
   * Stores the number of connections seen last time. If this has changed,
   * then in ports must have changed. So we can skip an inPortsChanged scan.
   * @private {number}
   */
  this.numConnections_ = 0;
};

_.inherit(visflow.Set, visflow.Node);

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
  if (this.numConnections_ != this.ports['in'].connections.length) {
    this.numConnections_ = this.ports['in'].connections.length;
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
