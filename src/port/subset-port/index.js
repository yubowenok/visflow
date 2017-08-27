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

  /** @type {boolean} */
  this.isConstants = !!params.isConstants;

  /**
   * Class constructor for the package.
   * @type {Function}
   */
  this.packClass = this.isConstants ? visflow.Constants : visflow.Package;

  /**
   * Package the port currently possesses.
   * This stores either data items or constants.
   * @type {visflow.Constants|visflow.Package}
   */
  this.pack = new this.packClass();

  /** @type {!jQuery} */
  this.container = $();
};

_.inherit(visflow.SubsetPort, visflow.Port);

/** @const {boolean} */
visflow.SubsetPort.prototype.IS_SUBSET_PORT = true;

/**
 * Returns an array of port contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.SubsetPort.prototype.contextMenuItems = function() {
  return [
    {id: 'disconnect', text: 'Disconnect',
      icon: 'glyphicon glyphicon-minus-sign'},
    {id: 'export', text: 'Export Data',
      icon: 'glyphicon glyphicon-open'}
    //{id: 'flowSense', text: 'FlowSense',
    //  icon: 'glyphicon glyphicon-comment'}
  ];
};

/** @inheritDoc */
visflow.SubsetPort.prototype.connectable = function(port) {
  var result = visflow.SubsetPort.base.connectable.call(this, port);

  if (!result.connectable) {
    // already failed due to graph topology
    return result;
  }

  if (this.isConstants !== port.isConstants) {
    return _.extend(result, {
      reason: 'cannot connect constant port with data port'
    });
  }
  return result; // success
};

/** @inheritDoc */
visflow.SubsetPort.prototype.onConnected = function(edge) {
  // Check subset flow constraint and propagate subset flow computation.
  if (this.isInput) {
    // Make data reference.
    this.pack = edge.sourcePort.pack;
  }
  edge.sourcePort.pack.changed = true;
};

/** @inheritDoc */
visflow.SubsetPort.prototype.onDisconnected = function(edge) {
  if (this.isInput && this.connections.length == 0) {
    this.pack = new this.packClass();
  }
};

/**
 * Sets the jQuery container of the port.
 * @param {!jQuery} container
 */
visflow.SubsetPort.prototype.setContainer = function(container) {
  visflow.SubsetPort.base.setContainer.call(this, container);

  if (this.isConstants) {
    this.container.addClass('constants');
  }
};

/** @inheritDoc */
visflow.SubsetPort.prototype.info = function() {
  var text = this.text ? this.text + ': ' : '';
  var count = 0;
  if (this.isConstants) {
    var constants = this.pack.stringify();
    text += constants;
    count = this.pack.count();
  } else if (this.isInput) {
    count = this.pack.count();
  } else {
    count = this.pack.count();
    if (this.fromPort !== '') {
      count += '/' + this.node.getPort(this.fromPort).pack.count();
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
visflow.SubsetPort.prototype.changed = function(value) {
  if (value != undefined) {
    return this.pack.changed = value;
  }
  return this.pack.changed;
};

/** @inheritDoc */
visflow.SubsetPort.prototype.isEmpty = function() {
  return this.pack.isEmpty();
};
