/**
 * @fileoverview VisFlow popup panel.
 */

'use strict';

/** @const */
visflow.popupPanel = {};

/** @private {jQuery} */
visflow.popupPanel.container_;

/** @private @const {string} */
visflow.popupPanel.TEMPLATE_ =
    './src/panel/popup-panel/popup-panel.html';
/** @private @const {string} */
visflow.popupPanel.COMPACT_TEMPLATE_ =
    './src/panel/popup-panel/popup-panel-compact.html';

/** @private @const {number} */
visflow.popupPanel.REVERT_DURATION_ = 100;
/** @private @const {number} */
visflow.popupPanel.TRANSITION_DURATION_ = 300;
/** @private @const {number} */
visflow.popupPanel.SHORT_TRANSITION_DURATION_ = 200;

/** @private @const {number} */
visflow.popupPanel.COMPACT_PANEL_HEIGHT_ = 260;
/** @private @const {number} */
visflow.popupPanel.PANEL_HEIGHT_ = 800;
/** @private @const {number} */
visflow.popupPanel.MIN_TOP_ = 20;
/** @private @const {number} */
visflow.popupPanel.X_OFFSET_ = 20;

/** @private @const {number} */
visflow.popupPanel.TOOLTIP_DELAY_ = 1000;

/** @private @const {!Object} */
visflow.popupPanel.INIT_PANEL_CSS_ = {
  opacity: 0
};
/** @private @const {!Object} */
visflow.popupPanel.FADE_IN_PANEL_CSS_ = {
  opacity: 1,
  left: '+=10'
};

/** @private @const {!Object} */
visflow.popupPanel.INIT_BUTTON_CSS_ = {
  zoom: 2,
  opacity: 0
};
/** @private @const {!Object} */
visflow.popupPanel.FADE_IN_BUTTON_CSS_ = {
  zoom: 1,
  opacity: 1
};
/** @private @const {!Object} */
visflow.popupPanel.BUTTON_CSS_ = {
  zoom: '',
  opacity: ''
};

/**
 * Initializes the popup panel.
 */
visflow.popupPanel.init = function() {
  this.container_ = $('#popup-panel');
};

/**
 * Closes the popup panel.
 */
visflow.popupPanel.hide = function() {
  this.container_.hide();
};

/**
 * Filters the entries in the system add-node panel.
 */
visflow.popupPanel.filter = function(key) {
  if (this.container_ == null) {
    visflow.error('filterAddPanel found no popup panel');
    return
  }
  // two children(), there is a container div
  this.container_.container.find('.group').not('.' + key).remove();
  this.container_.container.find('.panel-button').not('.' + key).remove();
};

/**
 * Shows the system add-node panel.
 * @param {jQuery.event=} opt_event
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
    .load(template, this.initPanel_.bind(this));
};

/**
 * Initializes the panel after template has been loaded.
 * @private
 */
visflow.popupPanel.initPanel_ = function() {
  this.container_
    .show()
    .css(visflow.popupPanel.INIT_PANEL_CSS_)
    .animate(visflow.popupPanel.FADE_IN_PANEL_CSS_,
        visflow.popupPanel.TRANSITION_DURATION_);

  this.container_.find('.panel-button').tooltip({
    delay: visflow.popupPanel.TOOLTIP_DELAY_
  });

  this.container_.find('.panel-button')
    .each(function(index, button) {
      this.initButton_($(button));
    }.bind(this));
};

/**
 * Initializes the panel button.
 * @param {!jQuery} button
 * @private
 */
visflow.popupPanel.initButton_ = function(button) {
  var create = function (event) {
    var node = visflow.flow.createNode(button.attr('id'));

    $(node).on('visflow.ready', function() {
      node.container.css(_({
        left: event.pageX - node.container.width() / 2,
        top: event.pageY - node.container.height() / 2
      }).extend(visflow.popupPanel.INIT_BUTTON_CSS_));

      node.container.animate(visflow.popupPanel.FADE_IN_BUTTON_CSS_,
        visflow.popupPanel.SHORT_TRANSITION_DURATION_,
        function() {
          $(this).css(visflow.popupPanel.BUTTON_CSS_);
        });
    });

    visflow.popupPanel.hide();
    $('.dropzone-temp').remove();
    $('#main').droppable('disable');
  };

  button.draggable({
    revert: 'valid',
    revertDuration: visflow.popupPanel.REVERT_DURATION_,
    start: function () {
      // Create a temporary droppable under #main so that we cannot drop
      // the button to panel.
      var panelOffset = visflow.utils.offsetMain(this.container_);
      $('<div></div>')
        .addClass('dropzone-temp')
        .css({
          width: this.container_.width(),
          height: this.container_.height(),
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
    }.bind(this)
  });

  button.click(function (event) {
    create(event);
  });
};
