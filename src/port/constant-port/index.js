/**
 * @fileoverview Port for VisFlow subset flow constants.
 * TODO(bowen): separate subset port from constant port so that we don't do
 * nasty pack distinguishing.
 */

/**
 * ConstantPort constructor.
 * @param {visflow.params.Port} params
 * @extends {visflow.Port}
 * @constructor
 */
visflow.ConstantPort = function(params) {
  visflow.ConstantPort.base.constructor.call(this, params);

  /** @type {!visflow.Constants} */
  this.pack = new visflow.Constants();
};

_.inherit(visflow.ConstantPort, visflow.Port);

/** @inheritDoc */
visflow.ConstantPort.prototype.connectable = function(port) {
  var result = visflow.ConstantPort.base.connectable.call(this, port);

  if (!result.connectable) {
    // already failed due to graph topology
    return result;
  }

  if (port.IS_SUBSET_PORT) {
    return _.extend(result, {
      connectable: false,
      reason: 'cannot connect ConstantPort with SubsetPort'
    });
  }
  return result; // success
};


/** @inheritDoc */
visflow.ConstantPort.prototype.onConnected = function(edge) {
  if (this.isInput) {
    // Make constant reference.
    this.pack = /** @type {!visflow.ConstantPort} */(edge.sourcePort).pack;
  }
  edge.sourcePort.changed(true);
};

/**
 * Sets the jQuery container of the port.
 * @param {!jQuery} container
 */
visflow.ConstantPort.prototype.setContainer = function(container) {
  visflow.ConstantPort.base.setContainer.call(this, container);
  this.container.addClass('constants');
};

/** @inheritDoc */
visflow.ConstantPort.prototype.info = function() {
  var text = this.text ? this.text + ': ' : '';
  var constants = this.pack.stringify();
  text += constants;
  var count = this.pack.count();

  if (text.length > this.INFO_LENGTH) {
    text = text.substr(0, this.INFO_LENGTH - 3) + '...';
  }
  return text + ' (' + count + ' items)';
};
