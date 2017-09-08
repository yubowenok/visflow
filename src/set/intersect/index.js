/**
 * @fileoverview VisFlow set intersect module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Set}
 */
visflow.Intersect = function(params) {
  visflow.Intersect.base.constructor.call(this, params);
};

_.inherit(visflow.Intersect, visflow.Set);

/** @inheritDoc */
visflow.Intersect.prototype.processSync = function() {
  var inpacks = this.getDataInPort().packs;
  var outpack = this.getDataOutPort().pack;

  outpack.copy(new visflow.Subset());

  for (var i in inpacks) {
    if (!inpacks[i].isEmpty()) {
      outpack.copy(inpacks[i]);
      break;
    }
  }

  if (outpack.isEmptyData()) {
    // no data to intersect
    return;
  }

  for (var i in inpacks) {
    var inpack = inpacks[i];

    if (!outpack.data.matchDataFormat(inpack.data)) {
      return visflow.error(
        'cannot make intersection of two different types of datasets');
    }

    for (var itemIndex in outpack.items) {
      var index = +itemIndex;
      var item = inpack.items[index];
      if (item != null) {
        // Merge rendering properties.
        _.extend(outpack.items[index].properties, item.properties);
      } else {
        delete outpack.items[index];
      }
    }
  }
};
