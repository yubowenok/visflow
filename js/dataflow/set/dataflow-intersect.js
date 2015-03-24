
"use strict";

var extObject = {

  iconClass: "dataflow-intersect-icon dataflow-flat-icon",

  initialize: function(para) {
    DataflowIntersect.base.initialize.call(this, para);

    this.prepare();
  },

  show: function() {
    DataflowIntersect.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var inpacks = this.ports["in"].packs,
        outpack = this.ports["out"].pack;

    outpack.copy(DataflowPackage.new());

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

      if (!outpack.data.matchDataFormat(inpack.data))
        return console.error("cannot make intersection of two different types of datasets");

      for (var index in outpack.items) {
        var item = inpack.items[index];
        if (item != null) {
          // merge rendering property
          _(outpack.items[index].properties).extend(item.properties);
        } else {
          delete outpack.items[index];
        }
      }
    }
  }

};

var DataflowIntersect = DataflowSet.extend(extObject);
