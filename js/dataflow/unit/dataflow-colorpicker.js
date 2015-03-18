
/*
 * color picker unit that provides interface for choosing color
 *
 * change will be fired in {id:..., value:...}
 */

"use strict";

var extObject = {

  initialize: function(id, label) {
    this.id = id;
    this.label = label != null ? label : "";

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
      .addClass("dataflow-colorpicker-container")
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
      colorpicker.setColor(color, event);
    });
    input.iris({
      palettes: ['none', '#125', '#459', '#78b', '#ab0', '#de3', '#f0f'],
      change: function(event, ui) {
        var color = ui.color;
        if (color.error == true)
          color = "none";
        else
          color = color.toString();
        colorpicker.setColor(color, event);
      }
    });
    var toggleIris = function(event) {
      // exclusively hide all other iris picker
      core.viewManager.hideColorpickers();
      input.iris("show");
    };
    colorbox.mousedown(toggleIris);
    input.mousedown(toggleIris);
  },

  setColor: function(color, event) {
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
    this.changeCallback(event);
  },

  change: function(callback) {
    this.changeCallback = callback;
  }


};

var DataflowColorpicker = Base.extend(extObject);
