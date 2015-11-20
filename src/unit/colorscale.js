/**
 * VisFlow color scale unit that provides interface for choosing color scale.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.ColorScale = function(params) {
 visflow.ColorScale.base.constructor.call(this, params);

  this.options = params.options != null ? params.optinos : [];
  this.valueToItem = {};
  this.placeholder = params.placeholder;

  this.colorScales = visflow.viewManager.getColorScales(this.colorScalesLoaded);
};

visflow.utils.inherit(visflow.ColorScale, visflow.Unit);

/** @inheritDoc */
visflow.ColorScale.prototype.init = function() {
 visflow.ColorScale.base.init.call(this);
  var unit = this;

  var select2options = {};
  var input = this.input = $('<select></select>');
  if (this.placeholder != null) {
    select2options.placeholder = this.placeholder;
    select2options.allowClear = true;
    $('<option/>')
      .appendTo(input);
  }

  input
    .addClass('unit-select')
    .appendTo(this.jqcontainer)
    .select2(select2options)
    .change(function(event){
      var value = event.target.value;
      if (value == '') {
        value = null;
      }
      unit.setValue(value, event);
    });
  input.select2('val', this.value);

  // color scale special, replace original item by gradient divs
  input
    .on('select2-loaded', function(event) {
      // replace items by divs
      for (var value in unit.valueToItem) {
        var item = unit.valueToItem[value];
        if (item.div != null) {
          var option = $('.select2-result-label[role=option]:contains(' + item.text + ')');
          item.div.clone().appendTo(option);
        }
      }
    });

  if (this.colorScales != null) {
    this.setList(visflow.viewManager.colorScaleList);
    if (this.value != null) {
      this.setValue(this.value, null, true);
    }
  }
};

/** @inheritDoc */
visflow.ColorScale.prototype.setList = function(list) {
  var options = this.input.find('option');
  // there is a placeholder!
  if (this.placeholder != null)
    options = options.next();
  options.remove(); // clear previous list

  this.valueToItem = {};
  for (var i in list) {
    this.valueToItem[list[i].value] = list[i];
    var option = $('<option value="' + list[i].value + '">' + list[i].text +
        '</option>')
      .appendTo(this.input);
  }
};

/**
 * Handles color scale loaded event.
 */
visflow.ColorScale.prototype.colorScalesLoaded = function() {
  this.colorScales = visflow.viewManager.colorScales;
  this.setListcore(visflow.viewManager.colorScaleList);
  if (this.value != null) {
    // callback from view manager
    this.setValue(this.value, null, true);
  }
};

/** @inheritDoc */
visflow.ColorScale.prototype.setValue = function(value, event, noCallback) {
  if (event == null) {
    event = {};
  }

  this.value = value;
  this.input.select2('val', value);
  var item = this.valueToItem[value];
  this.jqunit.parent().find('#div-' + this.id).remove();
  if (item != null && item.div != null) {
    item.div
      .attr('id', 'div-' + this.id)
      .appendTo(this.jqunit);
  }


  if (!noCallback) {
    event.unitChange = {
      value: value,
      id: this.id
    };
    this.changeCallback(event);
  }
};
