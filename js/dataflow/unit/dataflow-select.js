
/*
 *
 * input unit that provides interface for selection list
 * change will be fired in {id:..., value:...}
 *
 */

"use strict";

var extObject = {

  initialize: function(para) {

    DataflowSelect.base.initialize.call(this, para);

    this.options = para.options != null ? para.optinos : [];

    this.value = null;
    this.textToValue = {};
    this.valueToText = {};

    this.placeholder = para.placeholder;

    this.prepare();
  },

  prepare: function() {

    DataflowSelect.base.prepare.call(this);
    var unit = this;

    var select2options = {};
    if (this.placeholder != null)
      select2options.placeholder = this.placeholder;

    var input = this.input = $("<select></select>")
      .addClass("dataflow-unit-select")
      .appendTo(this.jqcontainer)
      .select2(select2options)
      .change(function(event){
        var value = event.target.value;
        unit.setValue(value, event);
     });

    input.change(function(event) {
      var value = event.target.value;
      unit.setValue(value, event);
    });

  },

  setList: function(list) { // array of (value, text) pairs
    this.input.find("option").remove();
    this.valueToText = {};
    this.textToValue = {};
    for (var i in list) {
      this.textToValue[list[i].text] = list[i].value;
      this.valueToText[list[i].value] = list[i].text;
      $("<option value='" + list[i].value + "'>" + list[i].text + "</option>")
        .appendTo(this.input);
    }
  },

  setValue: function(value, event) {
    if (event == null)
      event = {};

    this.value = value;
    this.input.select2("val", value);

    event.unitChange = {
      value: value,
      id: this.id
    };
    this.value = value;
    this.changeCallback(event);
  }

};

var DataflowSelect = DataflowUnit.extend(extObject);
