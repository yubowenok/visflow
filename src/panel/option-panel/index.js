/**
 * @fileoverview VisFlow right option panel.
 */

/** @const */
visflow.optionPanel = {};

/** @const {number} */
visflow.optionPanel.COLLAPSED_WIDTH = 32;
/** @const {number} */
visflow.optionPanel.TRANSITION_TIME = 50;

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
 * Last loaded node.
 * @private {visflow.Node}
 */
visflow.optionPanel.loadedNode_ = null;

/**
 * Option panel container.
 * @private {jQuery}
 */
visflow.optionPanel.container_ = null;

/**
 * Initializes the option panel.
 */
visflow.optionPanel.init = function() {
  var container = visflow.optionPanel.container_ = $('#option-panel');
  var btnToggle = container.children('#btn-toggle');
  var btnPin = container.children('#btn-pin');
  btnToggle.click(function() {
    visflow.optionPanel.toggle();
    btnToggle.blur();
  });
  btnPin.click(function() {
    visflow.optionPanel.togglePin_();
    btnPin.blur();
  });

  container.find('.to-tooltip').tooltip({
    delay: visflow.panel.TOOLTIP_DELAY
  });

  visflow.optionPanel.initUpdateHandlers_();
};

/**
 * Creates event listeners for system events.
 * @private
 */
visflow.optionPanel.initUpdateHandlers_ = function() {
  visflow.listen(visflow.flow, visflow.Event.VISMODE, function() {
    visflow.optionPanel.updateVisMode_();
  });
};

/**
 * Gets the option panel content contianer.
 * @return {!jQuery}
 */
visflow.optionPanel.contentContainer = function() {
  return visflow.optionPanel.container_.find('.content');
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
          visflow.signal(visflow.optionPanel, visflow.Event.OPENED);
        } else {
          visflow.signal(visflow.optionPanel, visflow.Event.CLOSED);
        }
      }
    });
};

/**
 * Sets the last loaded node of the option panel, so as to avoid loading the
 * same template again.
 * @param {visflow.Node} node
 */
visflow.optionPanel.setLoadedNode = function(node) {
  visflow.optionPanel.loadedNode_ = node;
};

/**
 * Gets the last loaded node of the option panel.
 * @return {visflow.Node}
 */
visflow.optionPanel.loadedNode = function() {
  return visflow.optionPanel.loadedNode_;
};

/**
 * Loads a panel from given template. On complete it calls callback function
 * with panel container.
 * @param {string} template
 * @param {Function} complete
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
 * Closes the option panel, and clears the panel contents.
 */
visflow.optionPanel.close = function() {
  visflow.optionPanel.toggle(false);
  visflow.optionPanel.loadedNode_ = null;
  var clear = function() {
    visflow.optionPanel.clear_();
    visflow.unlisten(visflow.optionPanel, visflow.Event.CLOSED, clear);
  };
  visflow.listen(visflow.optionPanel, visflow.Event.CLOSED, clear);
};

/**
 * Clears the option panel content.
 * @private
 */
visflow.optionPanel.clear_ = function() {
  visflow.optionPanel.loadedNode_ = null;
  visflow.optionPanel.container_.find('.content').children('*').remove();
};

/**
 * Shows/hides the panel header according to visMode on/off.
 * @private
 */
visflow.optionPanel.updateVisMode_ = function() {
  var header = $('#option-panel .node-panel.panel-header');
  header.toggle(!visflow.flow.visMode);
};
