
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

    this.multiple = para.multiple;
    this.sortable = para.sortable;  // allow reordering of multiple

    this.list = para.list;  // list of options

    this.placeholder = para.placeholder;

    this.textToValue = {};

    this.prepare();
  },

  prepare: function() {

    DataflowSelect.base.prepare.call(this);
    var unit = this;

    var select2options = {};
    var input = this.input = $("<select></select>");

    if (this.multiple)
      input.attr("multiple", "multiple");

    if (this.placeholder != null) {
      select2options.placeholder = this.placeholder;
      select2options.allowClear = true;
      $("<option/>")
        .appendTo(input);
    }

    input
      .addClass("dataflow-unit-select")
      .appendTo(this.jqcontainer)
      .select2(select2options);

    if (!this.multiple) {
      input
        .change(function(event){
          var value = event.target.value;
          if (value == "") {
            value = null;
          }
          unit.setValue(value, event);
        });
    } else {
      input
        .change(function(event){
          if (event.added != null) {
            unit.value.push(event.added.id);
          }
          if (event.removed != null) {
            unit.value.splice(unit.value.indexOf(event.removed.id), 1);
          }
          unit.setValue(unit.value);
        });

      if (this.sortable) {
        input.parent().find(".select2-choices")
          .sortable({
            update: function(event, ui) {
              unit.value = [];
              input.parent().find(".select2-search-choice")
                .each(function() {
                  var text = $(this).children("div").text(); // get text inside tags
                  var value = unit.textToValue[text]; // convert to value
                  unit.value.push(value);
                });
              unit.setValue(unit.value);
            }
          });
      }
    }
    input.select2("val", this.value);

    if (this.list != null) {
      this.setList(this.list);
      if (this.value != null) {
        this.setValue(this.value, null, true);  // initial value, do not callback
      }
    }
  },

  setList: function(list) { // array of (value, text) pairs
    var options = this.input.find("option");
    // there is a placeholder!
    if (this.placeholder != null)
      options = options.next();
    options.remove(); // clear previous list

    this.textToValue = {};
    for (var i in list) {
      this.textToValue[list[i].text] = list[i].value;

      var option = $("<option value='" + list[i].value + "'>" + list[i].text + "</option>")
        .appendTo(this.input);
    }
  },

  setValue: function(value, event, noCallback) {
    if (event == null)
      event = {};

    var unit = this;

    this.value = value;
    this.input.select2("val", value);

    if (this.multiple) {
      // reorder the elements
      var choices = [];
      this.input.parent().find(".select2-search-choice")
        .each(function() {
          var text = $(this).children("div").text(),
              value = unit.textToValue[text];
          var index = unit.value.indexOf(value);
          choices[index] = $(this);
        });
      // search field shall appear last
      var searchField = this.input.parent().find(".select2-search-field");
      for (var i in choices) {
        choices[i].insertBefore(searchField);
      }
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
