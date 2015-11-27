/**
 * @fileoverview VisFlow right option panel.
 */

/** @const */
visflow.optionPanel = {};

/** @const {number} */
visflow.optionPanel.COLLAPSED_WIDTH = 32;
/** @const {number} */
visflow.optionPanel.TRANSITION_TIME = 250;

/**
 * Whether the panel is toggled on.
 * @type {boolean}
 */
visflow.optionPanel.isOpen = false;

/**
 * Whether the panel is pinned.
 * @type {boolean}
 */
visflow.optionPanel.pinned = false;

/**
 * Option panel container.
 * @private {jQuery}
 */
visflow.optionPanel.container_ = null;

/** @private @const {number} */
visflow.optionPanel.TOOLTIP_DELAY_ = 1000;

/**
 * Initializes the option panel.
 */
visflow.optionPanel.init = function() {
  this.container_ = $('#option-panel');
  var btnToggle = this.container_.children('#btn-toggle');
  var btnPin = this.container_.children('#btn-pin');
  btnToggle
    .click(function() {
      this.toggle();
      btnToggle.blur();
    }.bind(this));
  btnPin.click(function() {
      this.togglePin_();
      btnPin.blur();
    }.bind(this));

  this.container_.find('.to-tooltip').tooltip({
    delay: visflow.optionPanel.TOOLTIP_DELAY_
  });
};

/**
 * Gets the current width of the option panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
visflow.optionPanel.getWidth_ = function() {
  return visflow.optionPanel.container_.find('.content').outerWidth() +
    visflow.optionPanel.COLLAPSED_WIDTH;
};

/**
 * Toggles the pin state.
 * @private
 */
visflow.optionPanel.togglePin_ = function() {
  visflow.optionPanel.pinned = !visflow.optionPanel.pinned;
  visflow.optionPanel.container_.children('#btn-pin').toggleClass('active');
  visflow.optionPanel.container_.children('#btn-toggle')
    .prop('disabled', visflow.optionPanel.pinned);
};

/**
 * Clears the panel content.
 */
visflow.optionPanel.clear = function() {
  visflow.optionPanel.container_.find('.content').html('');
};

/**
 * Toggles the option panel.
 * @param {boolean=} opt_state Whether the panel shall be open.
 */
visflow.optionPanel.toggle = function(opt_state) {
  if (visflow.optionPanel.pinned) {
    return;
  }

  visflow.optionPanel.container_.toggleClass('active');
  if (opt_state == null) {
    visflow.optionPanel.isOpen = !visflow.optionPanel.isOpen;
  } else {
    visflow.optionPanel.isOpen = opt_state;
  }
  var rightValue = visflow.optionPanel.isOpen ? 0 :
      -(visflow.optionPanel.getWidth_() - visflow.optionPanel.COLLAPSED_WIDTH);
  visflow.optionPanel.container_.stop()
    .animate({
      right: rightValue + 'px'
    }, {
    duration: visflow.optionPanel.TRANSITION_TIME,
    complete: function() {
      if (visflow.optionPanel.isOpen) {
        $('#btn-toggle')
          .children('span')
          .addClass('glyphicon-chevron-right')
          .removeClass('glyphicon-chevron-left');
      } else {
        $('#btn-toggle')
          .children('span')
          .removeClass('glyphicon-chevron-right')
          .addClass('glyphicon-chevron-left');
      }
    }
  });
};

/**
 * Loads a panel from given template. On complete it calls callback function
 * with panel container.
 * @param {string} template
 * @param {function} complete
 */
visflow.optionPanel.load = function(template, complete) {
  var container = visflow.optionPanel.container_;
  visflow.optionPanel.toggle(true);
  var content = container.children('.content');
  content.load(template, function() {
    complete($(this));
  });
};

/**
 * Closes the option panel.
 */
visflow.optionPanel.close = function() {
  visflow.error('close not implemented');
};
