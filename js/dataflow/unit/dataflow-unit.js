
/*
 *
 * colorpicker unit that provides interface for choosing color
 * change will be fired in {id:..., value:...}
 *
 */

"use strict";

var extObject = {

  initialize: function(para) {
    if (para == null || para.id == null)
      return console.error("null para or para.id");

    this.id = para.id;
    this.label = para.label != null ? para.label : "";
    this.labelWidth = para.labelWidth;
    this.containerWidth = para.containerWidth;
    this.changeCallback = para.change != null ? para.change : function(event) {};
  },

  prepare: function() {
    this.jqunit = $("<div></div>")
      .addClass("dataflow-unit");

    var jqlabel = $("<div></div>")
      .addClass("dataflow-unit-text")
      .text(this.label)
      .appendTo(this.jqunit);
    if (this.labelWidth != null)
      jqlabel.css("width", this.labelWidth);

    this.jqcontainer = $("<div></div>")
      .addClass("dataflow-unit-container")
      .appendTo(this.jqunit);
    if (this.labelWidth != null)
      this.jqcontainer.css("left", this.labelWidth);

    // shall set container width
    if (this.containerWidth != null)
      this.jqcontainer.css("width", this.containerWidth);
  },

  // abstract
  setValue: function(value, event) {},

  change: function(callback) {
    this.changeCallback = callback;
  }

};

var DataflowUnit = Base.extend(extObject);
