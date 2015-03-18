
"use strict";

var extObject = {

  iconName: "minus",

  initialize: function(para) {
    DataflowMinus.base.initialize.call(this, para);

    this.prepare();
  },

  show: function() {
    DataflowMinus.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");

    // for every item in A, check if it is in B
    var result = [];
    for (var index in packa.items) {
      var itema = packa.items[index];
      var itemb = packb.items[index];
      if (itemb == null) {
        result.push(index);
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(packa);  // either A or B works
    outpack.filter(result);
  }


};

var DataflowMinus = DataflowSet.extend(extObject);
