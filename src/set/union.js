/**
 * @fileoverview VisFlow set union module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Union = function(params) {
  visflow.Union.base.constructor.call(this, params);
  this.init();
};

visflow.utils.inherit(visflow.Union, visflow.Set);

/** @inheritDoc */
visflow.Union.prototype.MINIMIZED_CLASS =
    'union-icon flat-icon';

/** @inheritDoc */
visflow.Union.prototype.show = function() {
  visflow.Union.base.show.call(this); // call parent settings
  this.showIcon();
};

/** @inheritDoc */
visflow.Union.prototype.process = function() {
  var inpacks = this.ports['in'].packs,
      outpack = this.ports['out'].pack;

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
