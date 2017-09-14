/**
 * @fileoverview Port of VisFlow subset flow nodes, used to transmit subsets /
 * constants.
 */

/**
 * SubsetPort constructor.
 * @param {visflow.params.Port} params
 * @extends {visflow.Port}
 * @constructor
 */
visflow.SubsetPort = function(params) {
  visflow.SubsetPort.base.constructor.call(this, params);

  /** @type {!jQuery} */
  this.container = $();

  /** @type {!visflow.Subset} */
  this.pack = new visflow.Subset();
};

_.inherit(visflow.SubsetPort, visflow.Port);

/** @inheritDoc */
visflow.SubsetPort.prototype.connectable = function(port) {
  var result = visflow.SubsetPort.base.connectable.call(this, port);

  if (!result.connectable) {
    // already failed due to graph topology
    return result;
  }

  if (port.IS_CONSTANT_PORT) {
    return _.extend(result, {
      connectable: false,
      reason: 'cannot connect SubsetPort with ConstantPort'
    });
  }
  return result; // success
};

/** @inheritDoc */
visflow.SubsetPort.prototype.onConnected = function(edge) {
  if (this.isInput) {
    // Make data reference.
    this.pack = edge.sourcePort.getSubset();
  }
  edge.sourcePort.changed(true);
};

/** @inheritDoc */
visflow.SubsetPort.prototype.initContextMenu = function() {
  var contextMenu = visflow.SubsetPort.base.initContextMenu.call(this);

  visflow.listen(contextMenu, visflow.Event.EXPORT, function() {
    visflow.upload.export(this.pack);
  }.bind(this));

  return contextMenu;
};

/** @inheritDoc */
visflow.SubsetPort.prototype.onDisconnected = function(edge) {
  if (this.isInput && this.connections.length == 0) {
    this.pack = new visflow.Subset();
  }
};

/** @inheritDoc */
visflow.SubsetPort.prototype.info = function() {
  var text = this.text ? this.text + ': ' : '';
  var count = 0;
  if (this.isInput) {
    count = this.pack.count();
  } else {
    count = this.pack.count();
    if (this.fromPort !== '') {
      count += '/' + this.node.getPort(this.fromPort).getSubset().count();
    }
  }
  if (text.length > this.INFO_LENGTH) {
    text = text.substr(0, this.INFO_LENGTH - 3) + '...';
  }
  return text + ' (' + count + ' items)';
};

/** @inheritDoc */
visflow.SubsetPort.prototype.interaction = function() {
  visflow.SubsetPort.base.interaction.call(this);

  this.container
    .dblclick(function() {
      this.info();
      // For debugging.
      console.log(this.pack, this);
    }.bind(this));
};

/** @inheritDoc */
visflow.SubsetPort.prototype.isEmpty = function() {
  return this.pack.isEmpty();
};

/** @inheritDoc */
visflow.SubsetPort.prototype.getSubset = function() {
  return /** @type {!visflow.Subset} */(this.pack);
};
