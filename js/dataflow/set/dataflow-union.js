
"use strict";

var extObject = {

  iconClass: "dataflow-union-icon dataflow-flat-icon",

  initialize: function(para) {
    DataflowUnion.base.initialize.call(this, para);

    this.prepare();
  },

  show: function() {
    DataflowUnion.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var inpacks = this.ports["in"].packs,
        outpack = this.ports["out"].pack;

    outpack.copy(DataflowPackage.new());

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
        return console.error("cannot make intersection of two different types of datasets");

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
  }

};

var DataflowUnion = DataflowSet.extend(extObject);
