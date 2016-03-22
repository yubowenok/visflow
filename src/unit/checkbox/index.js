/**
 * @fileoverview VisFlow checkbox unit.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   value: (boolean|undefined),
 *   title: (string|undefined)
 * }} params
 * @constructor
 */
visflow.Checkbox = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {boolean} */
  this.value_ = params.value != null ? params.value : false;

  /** @private {?string} */
  this.title_ = params.title != null ? params.title : null;

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
  }.bind(this));
};

/** @private @const {string} */
visflow.Checkbox.prototype.TEMPLATE_ =
  './dist/html/unit/checkbox/checkbox.html';

/**
 * Initializes the checkbox.
 * @private
 */
visflow.Checkbox.prototype.init_ = function() {
  var title = this.container_.find('#title');
  if (this.title_ != null) {
    title.text(this.title_);
  } else {
    title.hide();
  }

  var input = this.container_.find('input');
  input.bootstrapSwitch({
    size: 'mini',
    state: this.value_
  });
  input.on('switchChange.bootstrapSwitch', function(event, state) {
    this.toggle(state);
  }.bind(this));

  if (this.value_ != null) {
    this.toggle(this.value_);
  }
};

/**
 * Toggles the checkbox.
 * @param {boolean=} opt_value
 */
visflow.Checkbox.prototype.toggle = function(opt_value) {
  var newValue = opt_value != null ? opt_value : !this.value_;
  if (newValue == this.value_) {
    return;
  }
  this.value_ = newValue;
  visflow.signal(this, 'change', this.value_);
};
