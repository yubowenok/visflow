/**
 * @fileoverview VisFlow text input unit.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Unit}
 */
visflow.Input = function(params) {
  visflow.Input.base.constructor.call(this, params);

  this.accept = params.accept != null ? params.accept : 'string';
  this.range = params.range != null ? params.range : [null, null];
  this.scrollDelta = params.scrollDelta != null ? params.scrollDelta : false;
};

visflow.utils.inherit(visflow.Input, visflow.Unit);

/** @inheritDoc */
visflow.Input.prototype.init = function() {
  visflow.Input.base.init.call(this);

  var unit = this;

  var input = this.jqinput = $('<input type="text" value=""/>')
    .addClass('input unit-input')
    .appendTo(this.jqcontainer);

  input.change(function(event) {
    var value = event.target.value;
    unit.setValue(value, event);
  });

  if (this.scrollDelta != false && visflow.utils.typeToGrade[this.accept] <=
      visflow.utils.typeToGrade['float']
      // only float or int can be scrolled
    ) {
    input.mousewheel(function(event) {
      // send scroll event to callback
      var delta = event.deltaY * event.deltaFactor;
      var sign = delta > 0 ? 1 : -1;
      if (unit.value == '')
        unit.value = 0; // prevent NaN

      var newValue;
      if (unit.accept == 'int') {
        newValue = parseInt(unit.value + sign * unit.scrollDelta);
      } else {
        newValue = (parseFloat(unit.value) + sign * unit.scrollDelta)
            .toPrecision(3);
      }
      unit.setValue(newValue);
    });
  }

  if (this.value != null)
    this.setValue(this.value, null, true);
};

/** @inheritDoc */
visflow.Input.prototype.setValue = function(value, event, noCallback) {
  if (event == null) {
    event = {};
  }

  var e = visflow.utils.parseToken(value);
  if (e.grade > visflow.utils.typeToGrade[this.accept]) {
    // cannot accept a greater grade element
    value = '';
  } else {
    value = e.value;
  }

  // fix value in range
  if (this.range[0] != null && value < this.range[0]) {
    value = this.range[0];
  }
  if (this.range[1] != null && value > this.range[1]) {
    value = this.range[1];
  }

  this.jqinput.val(value);
  this.value = value;

  if (!noCallback) {
    event.unitChange = {
      value: value,
      id: this.id
    };
    this.changeCallback(event);
  }
};