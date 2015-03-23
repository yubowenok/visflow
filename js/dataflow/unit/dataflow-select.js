
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
    this.valueToItem = {};

    this.placeholder = para.placeholder;

    this.prepare();
  },

  prepare: function() {

    DataflowSelect.base.prepare.call(this);
    var unit = this;

    var select2options = {};
    var input = this.input = $("<select></select>");
    if (this.placeholder != null) {
      select2options.placeholder = this.placeholder;
      select2options.allowClear = true;
      $("<option/>")
        .appendTo(input);
    }

    input
      .addClass("dataflow-unit-select")
      .appendTo(this.jqcontainer)
      .select2(select2options)
      .change(function(event){
        var value = event.target.value;
        if (value == "") {
          value = null;
        }
        unit.setValue(value, event);
      });
    input.select2("val", this.value);

    input
      .on("select2-loaded", function(event) {
        // replace items by divs
        for (var value in unit.valueToItem) {
          var item = unit.valueToItem[value];
          if (item.div != null) {
            var option = $(".select2-result-label[role=option]:contains(" + item.text + ")");
            item.div.clone().appendTo(option);
          }
        }
      });
  },

  setList: function(list) { // array of (value, text) pairs
    var options = this.input.find("option");
    // there is a placeholder!
    if (this.placeholder != null)
      options = options.next();
    options.remove(); // clear previous list

    this.valueToItem = {};
    this.textToValue = {};
    for (var i in list) {
      this.textToValue[list[i].text] = list[i].value;
      this.valueToItem[list[i].value] = list[i];

      var option = $("<option value='" + list[i].value + "'>" + list[i].text + "</option>")
        .appendTo(this.input);
    }
  },

  setValue: function(value, event, noCallback) {
    if (event == null)
      event = {};

    this.value = value;
    this.input.select2("val", value);
    var item = this.valueToItem[value];
    if (item != null && item.div != null) {
      this.jqunit.parent().find("#div-" + this.id).remove();
      item.div
        .attr("id", "div-" + this.id)
        .insertAfter(this.jqunit);
    }

    if (!noCallback) {
      event.unitChange = {
        value: value,
        id: this.id
      };
      this.changeCallback(event);
    }
  }

};

var DataflowSelect = DataflowUnit.extend(extObject);
