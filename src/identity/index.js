/**
 * @fileoverview An identity computation node that simply copies its input data
 * to its output. This is to test the system's capability of treating each
 * computation node's output as unique data types.
 */

/**
 * @param {!Object} params
 * @constructor
 * @abstract
 * @extends {visflow.ComputationNode}
 */
visflow.Identity = function(params) {
  visflow.Identity.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.ComputationPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.ComputationPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };
};

_.inherit(visflow.Identity, visflow.ComputationNode);


/** @inheritDoc */
visflow.Identity.prototype.init = function() {
  visflow.Identity.base.init.call(this);
};

/**
 * Serializes the compute node.
 * @return {!Object}
 */
visflow.Identity.prototype.serialize = function() {
  var result = visflow.Identity.base.serialize.call(this);
  return result;
};

/**
 * Deserializes the compute node.
 * @param {!Object} save
 */
visflow.Identity.prototype.deserialize = function(save) {
  visflow.Identity.base.deserialize.call(this, save);
  this.fillOptions(this.options, this.identityOptions());
};

/** @inheritDoc */
visflow.Identity.prototype.processAsync = function(endProcess) {
  var inPort = this.getPort('in');
  var outPort = this.getPort('out');
  outPort.pack.copy(inPort.pack, true);
  endProcess();
};

/** @inheritDoc */
visflow.Identity.prototype.showDetails = function() {
  this.content.children().remove();
  $('<div></div>').text(this.type).appendTo(this.content);
};

/** @inheritDoc */
visflow.Identity.prototype.getPortSubset = function(id) {
  if (this.getPort('in').connected()) {
    var port = /** @type {!visflow.ComputationPort} */(this.getPort(id));
    return port.pack;
  } else {
    // TODO(bowen): [test only] output a dummy table if no input exists.
    var tabularData = visflow.parser.csv([
      'a,b,c',
      '33,1.25,xyz1',
      '44,2.55,xyz2',
      '55,3.75,xyz3'
    ].join('\n'));
    return new visflow.Subset(new visflow.Dataset(tabularData));
  }
};
