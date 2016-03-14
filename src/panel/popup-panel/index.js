/**
 * @fileoverview VisFlow popup panel.
 */

/** @const */
visflow.popupPanel = {};

/** @private {!jQuery} */
visflow.popupPanel.container_ = $();

/** @private @const {string} */
visflow.popupPanel.TEMPLATE_ =
    './dist/html/panel/popup-panel/popup-panel.html';
/** @private @const {string} */
visflow.popupPanel.COMPACT_TEMPLATE_ =
    './dist/html/panel/popup-panel/popup-panel-compact.html';

/** @private @const {number} */
visflow.popupPanel.REVERT_DURATION_ = 100;

/** @private @const {number} */
visflow.popupPanel.COMPACT_PANEL_HEIGHT_ = 260;
/** @private @const {number} */
visflow.popupPanel.PANEL_HEIGHT_ = 800;
/** @private @const {number} */
visflow.popupPanel.MIN_TOP_ = 20;
/** @private @const {number} */
visflow.popupPanel.X_OFFSET_ = 20;

/** @private @const {!Object} */
visflow.popupPanel.INIT_PANEL_CSS_ = {
  opacity: 0
};
/** @private @const {!Object} */
visflow.popupPanel.FADE_IN_PANEL_CSS_ = {
  opacity: 1,
  left: '+=10'
};

/**
 * Initializes the popup panel.
 */
visflow.popupPanel.init = function() {
  visflow.popupPanel.container_ = $('#popup-panel');
};

/**
 * Closes the popup panel.
 */
visflow.popupPanel.hide = function() {
  visflow.popupPanel.container_.hide();
};

/**
 * Shows the system add-node panel.
 * @param {jQuery.Event=} opt_event
 * @param {boolean=} opt_compact
 */
visflow.popupPanel.show = function(opt_event, opt_compact) {
  var event = opt_event != null ? opt_event : {
    pageX: visflow.interaction.mouseX,
    pageY: visflow.interaction.mouseY
  };
  var compact = opt_compact != null ? opt_compact : true;

  var container = visflow.popupPanel.container_;

  if (compact) {
    container.addClass('compact');
  } else {
    container.removeClass('compact');
  }

  var template = compact ? visflow.popupPanel.COMPACT_TEMPLATE_ :
      visflow.popupPanel.TEMPLATE_;

  var panelHeight = compact ? visflow.popupPanel.COMPACT_PANEL_HEIGHT_ :
      visflow.popupPanel.PANEL_HEIGHT_;
  container
    .css({
      left: event.pageX + visflow.popupPanel.X_OFFSET_,
      top: Math.max(visflow.popupPanel.MIN_TOP_,
          Math.min(event.pageY, $(window).height() - panelHeight))
    })
    .load(template, visflow.popupPanel.initPanel_);
};

/**
 * Initializes the panel after template has been loaded.
 * @private
 */
visflow.popupPanel.initPanel_ = function() {
  var container = visflow.popupPanel.container_;
  container
    .show()
    .css(visflow.popupPanel.INIT_PANEL_CSS_)
    .animate(visflow.popupPanel.FADE_IN_PANEL_CSS_,
        visflow.panel.TRANSITION_DURATION);

  container.find('.panel-button').tooltip({
    delay: visflow.panel.TOOLTIP_DELAY
  });

  container.find('.panel-button')
    .each(function(index, button) {
      visflow.popupPanel.initButton_($(button));
    });
};

/**
 * Initializes the panel button.
 * @param {!jQuery} button
 * @private
 */
visflow.popupPanel.initButton_ = function(button) {
  var create = function() {
    var node = visflow.flow.createNode(/** @type {string} */(
      button.attr('id')));

    $(node).on('vf.ready', function() {
      var container = node.getContainer();
      container.css(_.extend({
        left: visflow.interaction.mouseX - container.width() / 2,
        top: visflow.interaction.mouseY - container.height() / 2
      }, visflow.panel.INIT_BUTTON_CSS));

      container.animate(visflow.panel.FADE_IN_BUTTON_CSS,
        visflow.panel.SHORT_TRANSITION_DURATION,
        function() {
          container.css(visflow.panel.BUTTON_CSS);
        });
    });

    visflow.popupPanel.hide();
    $('.dropzone-temp').remove();
    $('#main').droppable('disable');
  };

  button.draggable({
    revert: 'valid',
    revertDuration: visflow.popupPanel.REVERT_DURATION_,
    start: function() {
      // Create a temporary droppable under #main so that we cannot drop
      // the button to panel.
      var panelOffset = visflow.utils.offsetMain(visflow.popupPanel.container_);
      $('<div></div>')
        .addClass('dropzone-temp')
        .css({
          width: visflow.popupPanel.container_.width(),
          height: visflow.popupPanel.container_.height(),
          left: panelOffset.left,
          top: panelOffset.top
        })
        .droppable({
          accept: '.panel-button',
          greedy: true, // Prevent #main be dropped at the same time
          tolerance: 'pointer'
        })
        .appendTo('#main');

      $('#main').droppable({
        disabled: false,
        accept: '.panel-button',
        drop: create
      });
    }
  });

  button.click(function() {
    create();
  });
};
