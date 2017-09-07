/**
 * @fileoverview Port that accepts multiple subsets.
 */

/**
 * @param {visflow.params.Port} params
 * @constructor
 * @extends {visflow.SubsetPort}
 */
visflow.MultiSubsetPort = function(params) {
  visflow.MultiSubsetPort.base.constructor.call(this, params);

  if (this.isInput) {
    /**
     * For in-multiple, use array to store packs.
     * this.pack will be referencing the last connected pack.
     * @type {!Array<!visflow.Subset>}
     */
    this.packs = [];
  }
};

_.inherit(visflow.MultiSubsetPort, visflow.SubsetPort);

/** @inheritDoc */
visflow.MultiSubsetPort.prototype.setContainer = function(container) {
  visflow.MultiSubsetPort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('multiple');
};


/** @inheritDoc */
visflow.MultiSubsetPort.prototype.hasMoreConnections = function() {
  // Multiple ports have no connection limit.
  return true;
};

/** @inheritDoc */
visflow.MultiSubsetPort.prototype.connect = function(edge) {
  if (this.isInput) {
    this.packs.push(edge.sourcePort.getSubset());
    // For in-multiple this.pack references the last connected pack,
    // which is set at the base class's connect function.
  }
  visflow.MultiSubsetPort.base.connect.call(this, edge);
};

/** @inheritDoc */
visflow.MultiSubsetPort.prototype.disconnect = function(edge) {
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
  visflow.MultiSubsetPort.base.disconnect.call(this, edge);
};
