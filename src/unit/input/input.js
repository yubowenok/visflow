/**
 * @fileoverview VisFlow text input interface.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *       Container of the select
 *   accept: string,
 *       Accepted value type, int float or string
 *   range: Array<number>,
 *       Numerical value range
 *   scrollDelta: number,
 *       Delta value to change on mousewheel
 *   value: string|number,
 *       Initial value
 *   title: string
 * }} params
 * @constructor
 */
visflow.Input = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {string} */
  this.title_ = params.title;

  /** @private {string} */
  this.accept_ = params.accept != null ? params.accept : 'string';

  /** @private {!Array<number>} */
  this.range_ = params.range != null ? params.range : [null, null];

  /** @private {number} */
  this.scrollDelta_ = params.scrollDelta != null ? params.scrollDelta : null;

  /** @private {string|number} */
  this.value_ = params.value != null ? params.value : '';

  /**
   * Only float or int can be scrolled.
   * @private {boolean}
   */
  this.scrollable_ = this.scrollDelta_ != null &&
      visflow.utils.typeToGrade[this.accept_] <=
      visflow.utils.typeToGrade['float'];

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
  }.bind(this));
};

/** @private @const {string} */
visflow.Input.prototype.TEMPLATE_ = './src/unit/input/input.html';

/** @inheritDoc */
visflow.Input.prototype.init_ = function() {
  var title = this.container_.find('#title');
  if (this.title_) {
    title.text(this.title_);
  } else {
    title.hide();
  }

  var input = this.container_.find('input');
  input.change(function(event) {
    this.setValue_(event.target.value);
  }.bind(this));

  if (this.scrollable_) {
    input.mousewheel(function(event) {
      // Send scroll event to callback
      var delta = event.deltaY * event.deltaFactor;
      var sign = delta > 0 ? 1 : -1;

      if (this.value_ == '') {
        this.value_ = 0;
      }

      var newValue;
      if (this.accept_ == 'int') {
        newValue = parseInt(this.value_ + sign * this.scrollDelta_);
      } else {
        newValue = (parseFloat(this.value_) + sign * this.scrollDelta_)
          .toPrecision(3);
      }
      this.setValue_(newValue);
    }.bind(this));
  }

  if (this.value_ != '') {
    input.val(this.value_);
  }
};

/**
 * Sets the value of the input.
 * @private
 */
visflow.Input.prototype.setValue_ = function(value) {
  var input = this.container_.find('input');
  var parsed = visflow.utils.parseToken(value);
  if (parsed.grade > visflow.utils.typeToGrade[this.accept_]) {
    // Cannot accept a greater grade value type.
    input.val(this.value_);
    return;
  } else {
    value = parsed.value;
  }
  // Fix numerical value range
  if (this.range_[0] != null && value < this.range_[0]) {
    value = this.range_[0];
  }
  if (this.range_[1] != null && value > this.range_[1]) {
    value = this.range_[1];
  }
  this.value_ = value;
  input.val(value);
  this.signal_('change', [value]);
};

/**
 * Fires an event.
 * @param {string} type
 * @private
 */
visflow.Input.prototype.signal_ = function(type) {
  $(this).trigger('visflow.' + type, [this.value_]);
};
