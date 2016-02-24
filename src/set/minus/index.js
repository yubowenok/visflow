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
    'inx': new visflow.Port({
      node: this,
      id: 'inx',
      isInput: true,
      isConstants: false
    }),
    // To subtract
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
};

_.inherit(visflow.Minus, visflow.Set);

/** @inheritDoc */
visflow.Minus.prototype.process = function() {
  var xpack = /** @type {!visflow.Package} */(this.ports['inx'].pack);
  var inpacks = /** @type {!visflow.MultiplePort} */(this.ports['in']).packs;
  var outpack = this.ports['out'].pack;

  outpack.copy(xpack);  // pick the X pack, potentially empty

  if (inpacks.length == 0 || xpack.isEmpty()) {
    // nothing to minus
    return;
  }

  for (var i in inpacks) {
    var inpack = inpacks[i];
    if (!outpack.data.matchDataFormat(inpack.data)) {
      return visflow.error(
        'cannot make intersection of two different types of datasets');
    }

    for (var index in inpack.items) {
      if (outpack.items[index] != null) {
        delete outpack.items[index];
      }
    }
  }
};
