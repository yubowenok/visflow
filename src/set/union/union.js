/**
 * @fileoverview VisFlow set union module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Set}
 */
visflow.Union = function(params) {
  visflow.Union.base.constructor.call(this, params);
};

visflow.utils.inherit(visflow.Union, visflow.Set);

/** @inheritDoc */
visflow.Union.prototype.NODE_CLASS = 'union';
/** @inheritDoc */
visflow.Union.prototype.NODE_NAME = 'Union';

/** @inheritDoc */
visflow.Union.prototype.process = function() {
  var inpacks = this.ports['in'].packs;
  var outpack = this.ports['out'].pack;

  outpack.copy(new visflow.Package());

  for (var i in inpacks) {
    if (!inpacks[i].isEmpty()) {
      outpack.copy(inpacks[i]);
      outpack.items = {};
      break;
    }
  }
  if (outpack.isEmptyData()) {
    // no data to union
    return;
  }

  for (var i in inpacks) {
    var inpack = inpacks[i];

    if (!outpack.data.matchDataFormat(inpack.data))
      return visflow.error('cannot make intersection of two different types of datasets');

    // enumerate all in pack, overwrite rendering properties
    for (var index in inpack.items) {
      var itemout = outpack.items[index];
      var item = inpack.items[index];
      if (itemout != null) {
        // merge rendering property
        _(itemout.properties).extend(item.properties);
      } else {
        outpack.items[index] = {
          properties: _.extend({}, item.properties)
        };
      }
    }
  }
};
