/**
 * @fileoverview VisFlow popup panel.
 */

'use strict';

/** @const */
visflow.popupPanel = {};

/** @private {jQuery} */
visflow.popupPanel.panel_ = null;

/** @private @const {string} */
visflow.popupPanel.TEMPLATE_ = './src/panel/add-panel.html';
/** @private @const {string} */
visflow.popupPanel.COMPACT_TEMPLATE_ = './src/panel/add-panel-compact.html';

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
 * Closes the popup panel.
 */
visflow.popupPanel.close = function() {
  if (this.panel_) {
    this.panel_.remove();
    this.panel_ = null;
  }
};

/**
 * Filters the entries in the system add-node panel.
 */
visflow.popupPanel.filter = function(key) {
  if (this.panel_ == null) {
    visflow.error('filterAddPanel found no addpanel');
    return
  }
  // two children(), there is a container div
  this.panel_.container.find('.group').not('.' + key).remove();
  this.panel_.container.find('.addpanel-button').not('.' + key).remove();
};

/**
 * Shows the system add-node panel.
 */
visflow.popupPanel.show = function(event, compact) {
  this.close();

  var template = compact ? visflow.popupPanel.COMPACT_TEMPLATE_ :
      visflow.popupPanel.TEMPLATE_;

  this.panel_ = $('<div></div>')
    .addClass('addpanel')
    .addClass(compact ? 'compact' : '')
    .css({
      left: event.pageX + visflow.popupPanel.X_OFFSET_,
      top: Math.max(visflow.popupPanel.MIN_TOP_,
          Math.min(event.pageY, $(window).height() - (compact ?
              visflow.popupPanel.COMPACT_PANEL_HEIGHT_ :
              visflow.popupPanel.PANEL_HEIGHT_)
          ))
    })
    .appendTo('body');
  this.panel_.load(template, this.initPanel_.bind(this));
};

/**
 * Initializes the panel after template has been loaded.
 * @private
 */
visflow.popupPanel.initPanel_ = function() {
  this.panel_
    .css(visflow.popupPanel.INIT_PANEL_CSS_)
    .animate(visflow.popupPanel.FADE_IN_PANEL_CSS_,
    visflow.popupPanel.TRANSITION_DURATION_);

  this.panel_.find('.addpanel-button').tooltip({
    tooltipClass: 'addpanel-tooltip'
  });

  this.panel_.find('.addpanel-button')
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
    node.container.css(_({
      left: event.pageX - node.container.width() / 2,
      top: event.pageY - node.container.height() / 2
    }).extend(visflow.popupPanel.INIT_BUTTON_CSS_));

    node.container.animate(visflow.popupPanel.FADE_IN_BUTTON_CSS_,
        visflow.popupPanel.SHORT_TRANSITION_DURATION_,
        function() {
          $(this).css(visflow.popupPanel.BUTTON_CSS_);
        });
    visflow.popupPanel.close();
    $('.dropzone-temp').remove();

    $('#main').droppable('disable');
  };

  button.draggable({
    revert: 'valid',
    revertDuration: visflow.popupPanel.REVERT_DURATION_,
    start: function () {
      // Create a temporary droppable under #main so that we cannot drop
      // the button to panel.
      $('<div></div>')
        .addClass('dropzone-temp')
        .css({
          width: this.panel_.width(),
          height: this.panel_.height(),
          left: this.panel_.offset().left,
          top: this.panel_.offset().top
        })
        .droppable({
          accept: '.addpanel-button',
          greedy: true, // Prevent #main be dropped at the same time
          tolerance: 'pointer'
        })
        .appendTo('#main');

      $('#main').droppable({
        disabled: false,
        accept: '.addpanel-button',
        drop: create
      });
    }.bind(this)
  });

  button.click(function (event) {
    create(event);
  });
};
