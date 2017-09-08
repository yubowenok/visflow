/**
 * @fileoverview Port that accepts multiple subsets.
 */

/**
 * @param {visflow.params.Port} params
 * @constructor
 * @extends {visflow.ConstantPort}
 */
visflow.MultiConstantPort = function(params) {
  visflow.MultiConstantPort.base.constructor.call(this, params);

  if (this.isInput) {
    // For in-multiple, use array to store packs.
    // this.pack will be referencing the last connected pack.
    this.packs = [];
  }
};

_.inherit(visflow.MultiConstantPort, visflow.ConstantPort);

/** @inheritDoc */
visflow.MultiConstantPort.prototype.setContainer = function(container) {
  visflow.MultiConstantPort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('multiple');
};


/** @inheritDoc */
visflow.MultiConstantPort.prototype.hasMoreConnections = function() {
  // Multiple ports have no connection limit.
  return true;
};

/** @inheritDoc */
visflow.MultiConstantPort.prototype.connect = function(edge) {
  if (this.isInput) {
    this.packs.push(edge.sourcePort.pack);
    // For in-multiple this.pack references the last connected pack,
    // which is set at the base class's connect function.
  }
  visflow.MultiConstantPort.base.connect.call(this, edge);
};

/** @inheritDoc */
visflow.MultiConstantPort.prototype.disconnect = function(edge) {
  if (this.isInput) {
    for (var i = 0; i < this.connections.length; i++) {
      if (this.connections[i] === edge) {
        this.packs.splice(i, 1);
        break;
      }
    }
  }
  // this.connections will be spliced in base class's disconnect, so we have to
  // splice the packs above.
  visflow.MultiConstantPort.base.disconnect.call(this, edge);
};
