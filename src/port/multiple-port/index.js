/**
 * @fileoverview VisFlow multiple port.
 */

/**
 * @param {visflow.params.Port} params
 * @constructor
 * @extends {visflow.Port}
 */
visflow.MultiplePort = function(params) {
  visflow.MultiplePort.base.constructor.call(this, params);

  if (this.isInput) {
    // For in-multiple, use array to store packs.
    // this.pack will be referencing the last connected pack.
    this.packs = [];
  }
};

_.inherit(visflow.MultiplePort, visflow.Port);

/** @inheritDoc */
visflow.MultiplePort.prototype.setContainer = function(container) {
  visflow.MultiplePort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('multiple');
};


/** @inheritDoc */
visflow.MultiplePort.prototype.hasMoreConnections = function() {
  // Multiple ports have no connection limit.
  return true;
};

/** @inheritDoc */
visflow.MultiplePort.prototype.connect = function(edge) {
  if (this.isInput) {
    this.packs.push(edge.sourcePort.pack);
    // For in-multiple this.pack references the last connected pack,
    // which is set at the base class's connect function.
  }
  visflow.MultiplePort.base.connect.call(this, edge);
};

/** @inheritDoc */
visflow.MultiplePort.prototype.disconnect = function(edge) {
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
  visflow.MultiplePort.base.disconnect.call(this, edge);
};

/** @inheritDoc */
visflow.MultiplePort.prototype.changed = function() {
  for (var i = 0; i < this.packs.length; i++) {
    if (this.packs[i].changed) {
      return true;
    }
  }
  return false;
};
