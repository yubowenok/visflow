/**
 * @fileoverview VisFlow checkbox unit.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Unit}
 */
visflow.Checkbox = function(params) {
  visflow.Checkbox.base.constructor.call(this, params);
};

/** @inheritDoc */
visflow.Checkbox.prototype.init = function() {
  visflow.Checkbox.base.init.call(this);

  var unit = this;

  var input = this.jqinput = $('<input type="checkbox" value=""/>')
    .addClass('input unit-checkbox')
    .appendTo(this.jqunit);

  $(this.jqlabel)
    .css('margin-right', 5)
    .appendTo(this.jqcontainer);
  this.jqcontainer
    .css('display', 'inline-block');

  input.change(function(event) {
    var value = $(this).is(':checked');
    unit.setValue(value, event);
  });

  if (this.value != null)
    this.setValue(this.value, null, true);
};

/** @inheritDoc */
visflow.Checkbox.prototype.setValue = function(value, event, noCallback) {
  if (event == null) {
    event = {};
  }

  this.jqinput.prop('checked', value);
  this.value = value;

  if (!noCallback) {
    event.unitChange = {
      value: value,
      id: this.id
    };
    this.changeCallback(event);
  }
};
