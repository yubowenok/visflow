
"use strict";

var extObject = {
  initialize: function(para) {
    if (para == null)
      para = {};
    this.jqview = para.jqview;
    this.id = para.id;
    this.name = para.name;

    this.jqview
      .attr("id", this.id);
  },
  show: function() {
    console.log("show of view");
  },
  update: function() {

  },
  close: function() {

  }
};

var View = Base.extend(extObject);
