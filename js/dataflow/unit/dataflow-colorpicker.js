
/*
 *
 * colorpicker unit that provides interface for choosing color
 * change will be fired in {id:..., value:...}
 *
 */

"use strict";

var extObject = {

  initialize: function(para) {
    this.id = para.id;
    this.label = para.label != null ? para.label : "";

    this.color = "none";

    this.prepare();

    this.changeCallback = function(event) {};
  },

  prepare: function() {

    this.jqunit = $("<div></div>")
      .addClass("dataflow-unit");

    $("<div></div>")
      .addClass("dataflow-unit-text")
      .text(this.label)
      .appendTo(this.jqunit);

    var container = $("<div></div>")
      .addClass("dataflow-unit-container")
      .appendTo(this.jqunit);

    var input = this.jqinput = $("<input type='text' value='none'/>")
      .addClass("dataflow-input dataflow-input-color")
      .appendTo(container);

    var colorbox = this.jqcolorbox = $("<div></div>")
      .addClass("dataflow-colorbox")
      .css("background-color", "none")
      .appendTo(this.jqunit);

    var colorpicker = this;
    input.change(function(event) {
      var color = event.target.value;
      colorpicker.setValue(color, event);
    });
    input.iris({
      color: this.color,
      palettes: ["none"].concat(d3.scale.category10().range()),
      change: function(event, ui) {
        var color = ui.color;
        if (color.error == true)
          color = "none";
        else
          color = color.toString();
        colorpicker.setValue(color, event);
      }
    });
    var toggleIris = function(event) {
      // exclusively hide all other iris picker, except this one
      core.viewManager.hideColorpickers(container.find(".iris-picker"));
      input.iris("toggle");
    };
    colorbox.mousedown(toggleIris);
    input.mousedown(toggleIris);
  },

  setValue: function(color, event) {
    if (event == null)
      event = {};

    color = color.toLowerCase();
    var m = color.match(/#?[a-f0-9]{6}/);
    if (m == null || m[0] != color) {
      // incorrect color format
      color = "none";
    }
    this.jqcolorbox
      .css("background-color", color == "none" ? "transparent" : color);
    this.jqinput.val(color);
    event.unitChange = {
      value: color,
      id: this.id
    };
    this.color = color;
    this.changeCallback(event);
  },

  change: function(callback) {
    this.changeCallback = callback;
  }


};

var DataflowColorpicker = Base.extend(extObject);
