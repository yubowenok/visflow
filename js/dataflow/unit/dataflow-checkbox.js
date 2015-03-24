
/*
 *
 * input unit that provides interface for typing text/value
 * change will be fired in {id:..., value:...}
 *
 */

"use strict";

var extObject = {

  initialize: function(para) {
    DataflowCheckbox.base.initialize.call(this, para);

    this.prepare();
  },

  prepare: function() {

    DataflowCheckbox.base.prepare.call(this);

    var unit = this;

    var input = this.jqinput = $("<input type='checkbox' value=''/>")
      .addClass("dataflow-input dataflow-unit-input")
      .appendTo(this.jqcontainer);

    this.jqcontainer.css({
      "padding-top": 2
    });

    input.change(function(event) {
      var value = $(this).is(":checked");
      unit.setValue(value, event);
    });

    if (this.value != null)
      this.setValue(this.value, null, true);
  },

  setValue: function(value, event, noCallback) {
    if (event == null)
      event = {};

    this.jqinput.prop("checked", value);
    this.value = value;

    if (!noCallback) {
      event.unitChange = {
        value: value,
        id: this.id
      };
      this.changeCallback(event);
    }
  }

};

var DataflowCheckbox = DataflowUnit.extend(extObject);
