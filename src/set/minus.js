/**
 * @fileoverview VisFlow set minus (diff) module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Minus = function(params) {
  visflow.Minus.base.constructor.call(this, params);

  this.inPorts = [
    new visflow.Port(this, 'inx', 'in-single', 'D'), // to be subtract from
    new visflow.Port(this, 'in', 'in-multiple', 'D') // to subtract
  ];
  this.outPorts = [
    new visflow.Port(this, 'out', 'out-multiple', 'D')
  ];

  this.init();
};

visflow.utils.inherit(visflow.Minus, visflow.Set);

/** @inheritDoc */
visflow.Minus.prototype.MINIMIZED_CLASS =
  'minus-icon flat-icon';

/** @inheritDoc */
visflow.Minus.prototype.show = function() {
  visflow.Minus.base.show.call(this); // call parent settings
  this.showIcon();
};

/** @inheritDoc */
visflow.Minus.prototype.process = function() {
  var xpack = this.ports['inx'].pack,
      inpacks = this.ports['in'].packs,
      outpack = this.ports['out'].pack;

  outpack.copy(xpack);  // pick the X pack, potentially empty

  if (inpacks.length == 0 || xpack.isEmpty()) {
    // nothing to minus
    return;
  }

  for (var i in inpacks) {
    var inpack = inpacks[i];
    if (!outpack.data.matchDataFormat(inpack.data))
      return visflow.error('cannot make intersection of two different types of datasets');

    for (var index in inpack.items) {
      if (outpack.items[index] != null) {
        delete outpack.items[index];
      }
    }
  }
};
