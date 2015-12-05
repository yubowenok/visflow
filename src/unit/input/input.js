/**
 * @fileoverview VisFlow text input interface.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *   accept: string=,
 *   range: Array<number>=,
 *   scrollDelta: number=,
 *   value: (string|number)=,
 *   title: string=,
 *   disabled: boolean=
 * }} params
 *     container: Container of the select.
 *     accept: Accepted value type, int float or string.
 *     range: Numerical value range.
 *     scrollDelta: Delta value to change on mousewheel.
 *     value: Initial value.
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

  /** @private {boolean} */
  this.disabled_ = params.disabled;

  /**
   * Only float or int can be scrolled.
   * @private {boolean}
   */
  this.scrollable_ = this.scrollDelta_ != null &&
      visflow.parser.TYPE_TO_GRADE[this.accept_] <=
      visflow.parser.TYPE_TO_GRADE['float'];

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
  }.bind(this));
};

/**
 * Input HTML template.
 * @private @const {string}
 */
visflow.Input.prototype.TEMPLATE_ = './src/unit/input/input.html';

/**
 * Initializes the Input.
 * @private
 */
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

      if (this.value_ === '') {
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

  if (this.value_ !== '') {
    var valueString = this.value_;
    if (this.value_ instanceof Array) {
      valueString = this.value_.join(', ');
    }
    input.val(valueString);
  }
  if (this.disabled_) {
    this.disable();
  }
};

/**
 * Sets the value of the input.
 * @private
 */
visflow.Input.prototype.setValue_ = function(value) {
  var input = this.container_.find('input');
  var parsedToken = visflow.parser.checkToken(value);
  if (parsedToken.grade > visflow.parser.TYPE_TO_GRADE[this.accept_]) {
    // Cannot accept a greater grade value type.
    input.val(this.value_);
    return;
  } else {
    value = parsedToken.value;
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
 * Disables the input.
 */
visflow.Input.prototype.disable = function() {
  var input = this.container_.find('input');
  input.prop('disabled', true);
  this.disabled_ = true;
};

/**
 * Enables the input.
 */
visflow.Input.prototype.enable = function() {
  var input = this.container_.find('input');
  input.prop('disabled', false);
  this.disabled_ = false;
};


/**
 * Fires an event.
 * @param {string} type
 * @private
 */
visflow.Input.prototype.signal_ = function(type) {
  $(this).trigger('visflow.' + type, [this.value_]);
};
