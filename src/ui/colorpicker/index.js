/**
 * @fileoverview VisFlow colorpicker UI element that provides interface for
 * choosing color.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   color: (string|undefined),
 *   title: (string|undefined),
 *   disabled: (boolean|undefined)
 * }} params
 *     container: Container of the VisFlow ColorPicker.
 *     value: Initial value of the ColorPicker.
 * @constructor
 */
visflow.ColorPicker = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {?string} */
  this.title_ = params.title != null ? params.title : null;

  /** @private {?string} */
  this.color_ = params.color != null ? params.color : null;

  /** @private {boolean} */
  this.disabled_ = !!params.disabled;

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
  }.bind(this));
};

/**
 * ColorPicker HTML template.
 * @private @const {string}
 */
visflow.ColorPicker.prototype.TEMPLATE_ =
    './dist/html/ui/colorpicker/colorpicker.html';

/** @private @const {number} */
visflow.ColorPicker.prototype.X_OFFSET_ = -50;
/** @private @const {number} */
visflow.ColorPicker.prototype.Y_OFFSET_ = 20;


/**
 * Initializes the ColorPicker.
 * @private
 */
visflow.ColorPicker.prototype.init_ = function() {
  var title = this.container_.find('#title');
  if (this.title_ == null) {
    title.hide();
  } else {
    title.text(this.title_);
  }

  var picker = this.container_.find('.input-group');
  picker.colorpicker({
    format: 'hex',
    container: this.container_.find('#picker'),
    component: '.input-group-addon'
  });
  if (this.color_ != null) {
    picker.colorpicker('setValue', this.color_);
  }

  $(picker).on('changeColor.colorpicker', this.change_.bind(this));
};

/**
 * Handles color change.
 * @param {jQuery.colorpicker.Event} event
 * @private
 */
visflow.ColorPicker.prototype.change_ = function(event) {
  var colorText = this.container_.find('#color-text').val();
  var newColor = event.color.toHex();
  if (colorText == '') {
    // Allow no color set.
    newColor = null;
  }
  if (newColor !== this.color_) {
    this.color_ = newColor;
    if (this.color_ == null) {
      this.container_.find('.input-group-addon').children('i')
        .css('background-color', '');
    }
    visflow.signal(this, visflow.Event.CHANGE, this.color_);
  }
};
