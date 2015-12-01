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
 * Gets the option panel content contianer.
 * @return {!jQuery}
 */
visflow.optionPanel.contentContainer = function() {
  return this.container_.find('.content');
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
  var newState;
  if (opt_state == null) {
    newState = !visflow.optionPanel.isOpen;
  } else {
    newState = opt_state;
  }

  if (!visflow.optionPanel.pinned && newState != visflow.optionPanel.isOpen) {
    visflow.optionPanel.isOpen = newState;
    visflow.optionPanel.container_.toggleClass('active');
    visflow.optionPanel.update_();
  }
};

/**
 * Updates the button icons.
 * @private
 */
visflow.optionPanel.updateButtons_ = function() {
  var container = visflow.optionPanel.container_;
  if (visflow.optionPanel.isOpen) {
    container.find('#btn-toggle')
      .children('span')
      .addClass('glyphicon-chevron-right')
      .removeClass('glyphicon-chevron-left');
  } else {
    container.find('#btn-toggle')
      .children('span')
      .removeClass('glyphicon-chevron-right')
      .addClass('glyphicon-chevron-left');
  }
};

/**
 * Updates the panel right offset and button style according to isOpen state
 * and content width, using animation.
 * @private
 */
visflow.optionPanel.update_ = function() {
  var container = visflow.optionPanel.container_;
  var content = container.find('.content');

  if (visflow.optionPanel.isOpen) {
    content.show();
  }

  var width = visflow.optionPanel.getWidth_();
  var openRight = -(width - visflow.optionPanel.COLLAPSED_WIDTH);
  var closeRight = 0;
  var rightStart = visflow.optionPanel.isOpen ? openRight : closeRight;
  var rightEnd = visflow.optionPanel.isOpen ? closeRight : openRight;
  container.stop()
    .css({
      right: rightStart
    })
    .animate({
      right: rightEnd
    }, {
      duration: visflow.optionPanel.TRANSITION_TIME,
      complete: function() {
        visflow.optionPanel.updateButtons_();
        if (!visflow.optionPanel.isOpen) {
          content.hide();
          container.css({
            right: 0
          });
        }
        if (visflow.optionPanel.isOpen) {
          visflow.optionPanel.signal_('opened');
        } else {
          visflow.optionPanel.signal_('closed');
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
  var content = container.children('.content');
  content.load(template, function() {
    complete($(this));
    visflow.optionPanel.toggle(true);
  });
};

/**
 * Closes the option panel.
 */
visflow.optionPanel.close = function() {
  visflow.optionPanel.toggle(false);
  var clear = function() {
    visflow.optionPanel.clear();
    $(visflow.optionPanel).off('visflow.closed', clear);
  };
  $(visflow.optionPanel).on('visflow.closed', clear);
};

/**
 * Clears the option panel content.
 */
visflow.optionPanel.clear = function() {
  visflow.optionPanel.container_.find('.content').children('*').remove();
};

/**
 * Signals a visflow event.
 * @param {string} eventType
 * @private
 */
visflow.optionPanel.signal_ = function(eventType) {
  $(visflow.optionPanel).trigger('visflow.' + eventType);
};
