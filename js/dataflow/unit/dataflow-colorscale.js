
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
    this.valueToItem = {};
    this.placeholder = para.placeholder;

    this.colorScales = core.viewManager.getColorScales(this.colorScalesLoaded);

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

    // color scale special, replace original item by gradient divs
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

    if (this.colorScales != null) {
      this.setList(core.viewManager.colorScaleList);
      if (this.value != null) {
        this.setValue(this.value, null, true);
      }
    }
  },

  setList: function(list) { // array of (value, text) pairs
    var options = this.input.find("option");
    // there is a placeholder!
    if (this.placeholder != null)
      options = options.next();
    options.remove(); // clear previous list

    this.valueToItem = {};
    for (var i in list) {
      this.valueToItem[list[i].value] = list[i];
      var option = $("<option value='" + list[i].value + "'>" + list[i].text + "</option>")
        .appendTo(this.input);
    }
  },

  colorScalesLoaded: function() {
    this.colorScales = core.viewManager.colorScales;
    this.setList(core.viewManager.colorScaleList);
    if (this.value != null) // callback from view manager
      this.setValue(this.value, null, true);
  },

  setValue: function(value, event, noCallback) {
    if (event == null)
      event = {};

    this.value = value;
    this.input.select2("val", value);
    var item = this.valueToItem[value];
    this.jqunit.parent().find("#div-" + this.id).remove();
    if (item != null && item.div != null) {
      item.div
        .attr("id", "div-" + this.id)
        .appendTo(this.jqunit);
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

var DataflowColorScale = DataflowSelect.extend(extObject);
