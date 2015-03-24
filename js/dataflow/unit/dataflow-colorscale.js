
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

    this.prepare();
  },

  prepare: function() {

    DataflowSelect.base.prepare.call(this);
    var unit = this;

    this.loadColorScaleList();

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
  },

  getScale: function(value) {
    if (this.colorScales == null)
      return null; // async not ready
    return this.colorScales[value];
  },

  loadColorScaleList: function() {

    var unit = this;

    $.get("js/dataflow/unit/colorScales.json", function(scales) {
      var list = [];
      unit.colorScales = {};
      for (var i in scales) {
        var scale = scales[i];
        // save to node, map from value to scale object
        unit.colorScales[scale.value] = scale;

        var div = $("<div></div>")
          .addClass("dataflow-scalevis");
        var gradient = "linear-gradient(to right,";
        if (scale.type == "color") {
          for (var j in scale.range) {
            gradient += scale.range[j];
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        } else if (scale.type == "color-category10") {
          scale.domain = d3.range(10);
          scale.range = d3.scale.category10().range();
          var n = scale.range.length;
          for (var j = 0; j < n; j++) {
            gradient += scale.range[j] + " " + (j * 100 / n) + "%,";
            gradient += scale.range[j] + " " + ((j + 1) * 100 / n) + "%";
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        }
        list.push({
          value: scale.value,
          text: scale.text,
          div: div
        });
      }
      unit.colorScaleList = list;
      unit.setList(list); // must setList before setValue
      if (unit.value　!= null) {
        unit.setValue(unit.value);
      }
    });
  }

};

var DataflowColorScale = DataflowSelect.extend(extObject);
