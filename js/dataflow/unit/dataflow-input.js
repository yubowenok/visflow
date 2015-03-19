
/*
 *
 * input unit that provides interface for typing text/value
 * change will be fired in {id:..., value:...}
 *
 */

"use strict";

var extObject = {

  initialize: function(para) {
    this.id = para.id;
    this.label = para.label != null ? para.label : "";
    this.accept = para.accept != null ? para.accept : "string";
    this.range = para.range != null ? para.range : [null, null];
    this.scrollDelta = para.scrollDelta != null ? para.scrollDelta : false;
    this.changeCallback = para.change != null? para.change : function(event) {};

    this.value = "";

    this.prepare();
  },

  prepare: function() {

    var unit = this;

    this.jqunit = $("<div></div>")
      .addClass("dataflow-unit");

    $("<div></div>")
      .addClass("dataflow-unit-text")
      .text(this.label)
      .appendTo(this.jqunit);

    var container = $("<div></div>")
      .addClass("dataflow-unit-container")
      .appendTo(this.jqunit);

    var input = this.jqinput = $("<input type='text' value=''/>")
      .addClass("dataflow-input dataflow-unit-input")
      .appendTo(container);

    input.change(function(event) {
      var value = event.target.value;
      unit.setValue(value, event);
    });

    if (this.scrollDelta != false
       && Utils.typeToGrade[this.accept] <= Utils.typeToGrade["float"]
        // only float or int can be scrolled
      ) {
      input.mousewheel(function(event) {
        // send scroll event to callback
        var delta = event.deltaY * event.deltaFactor;
        var sign = delta > 0 ? 1 : -1;
        var newValue = (parseFloat(unit.value) + sign * unit.scrollDelta).toPrecision(3);
        unit.setValue(newValue);
      });
    }

  },

  setValue: function(value, event) {
    if (event == null)
      event = {};

    var e = Utils.parseToken(value);
    if (e.grade > Utils.typeToGrade[this.accept]) {
      // cannot accept a greater grade element
      value = "";
    } else {
      value = e.value;
    }

    // fix value in range
    if (this.range[0] != null && value < this.range[0])
      value = this.range[0];
    if (this.range[1] != null && value > this.range[1])
      value = this.range[1];

    this.jqinput.val(value);

    event.unitChange = {
      value: value,
      id: this.id
    };
    this.value = value;
    this.changeCallback(event);
  },

  change: function(callback) {
    this.changeCallback = callback;
  }


};

var DataflowInput = Base.extend(extObject);
