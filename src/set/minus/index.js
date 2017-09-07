/**
 * @fileoverview VisFlow set minus (diff) module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Set}
 */
visflow.Minus = function(params) {
  visflow.Minus.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    // To be subtracted from
    'inx': new visflow.SubsetPort({
      node: this,
      id: 'inx',
      isInput: true
    }),
    // To subtract
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
};

_.inherit(visflow.Minus, visflow.Set);

/** @inheritDoc */
visflow.Minus.prototype.processSync = function() {
  var xpack = this.getPort('inx').getSubset();
  var inpacks = /** @type {!visflow.MultiSubsetPort} */(
      this.getDataInPort()).packs;
  var outpack = this.getDataOutPort().pack;

  outpack.copy(xpack);  // pick the X pack, potentially empty

  if (inpacks.length == 0 || xpack.isEmpty()) {
    // nothing to minus
    return;
  }

  for (var i = 0; i < inpacks.length; i++) {
    var inpack = inpacks[i];
    if (!outpack.data.matchDataFormat(inpack.data)) {
      return visflow.error(
        'cannot make intersection of two different types of datasets');
    }

    for (var itemIndex in inpack.items) {
      var index = +itemIndex;
      if (outpack.items[index] != null) {
        delete outpack.items[index];
      }
    }
  }
};

/** @inheritDoc */
visflow.Minus.prototype.getDataInPort = function() {
  return this.getDataPort('inx');
};

/**
 * Gets the port that accepts the input of the left side operand in a minus
 * operation (a.k.a. "X" in "X - Y").
 * @return {!visflow.SubsetPort}
 * @override
 */
visflow.Minus.prototype.getSecondDataInPort = function() {
  return this.getDataPort('in');
};
