/**
 * @fileoverview VisFlow panel for adding nodes.
 */

'use strict';

/** @const */
visflow.nodePanel = {};

/**
 * Node panel container.
 * @private {jQuery}
 */
visflow.nodePanel.container_;

/**
 * Node panel hover area.
 * @private {jQuery}
 */
visflow.nodePanel.hoverArea_;

/**
 * Node panel state.
 * @type {boolean}
 */
visflow.nodePanel.isOpen = false;

/** @private @const {string} */
visflow.nodePanel.TEMPLATE_ = './src/panel/node-panel/node-panel.html';
/** @private @const {number} */
visflow.nodePanel.TRANSITION_DURATION_ = 300;
/** @private @const {number} */
visflow.nodePanel.TOOLTIP_DELAY_ = 1000;

/**
 * Initializes the node panel and its interaction.
 */
visflow.nodePanel.init = function() {
  var container = $('#node-panel');
  visflow.nodePanel.container_ = container;
  visflow.nodePanel.hoverArea_ = container.children('.hover-area');

  var showPanel = function() {
    if (!visflow.nodePanel.isOpen) {
      visflow.nodePanel.toggle(true);
    }
  };
  container.find('#btn-toggle').mouseenter(showPanel);
  visflow.nodePanel.hoverArea_.mouseenter(showPanel);
};


/**
 * Toggles the node panel.
 * @param {boolean=} opt_state Whether the panel shall be open.
 */
visflow.nodePanel.toggle = function(opt_state) {
  var newState;
  if (opt_state == null) {
    newState = !visflow.nodePanel.isOpen;
  } else {
    newState = opt_state;
  }

  if (newState != visflow.nodePanel.isOpen) {
    visflow.nodePanel.isOpen = newState;
    if (newState) {
      visflow.nodePanel.show_();
    } else {
      visflow.nodePanel.hide_();
    }
  }
};

/**
 * Gets the current width of the node panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
visflow.nodePanel.getWidth_ = function() {
  return visflow.nodePanel.container_.find('.content').outerWidth();
};

/**
 * Shows the node panel.
 * @private
 */
visflow.nodePanel.show_ = function() {
  var content = visflow.nodePanel.container_.find('.content');
  content.load(this.TEMPLATE_, function() {
    var width = visflow.nodePanel.getWidth_();
    visflow.nodePanel.container_.stop()
      .css({
        left: -width
      })
      .animate({
        left: 0
      }, {
        duration: visflow.nodePanel.TRANSITION_DURATION_,
        complete: visflow.nodePanel.initPanel_
      });
  });
};

/**
 * Hides the node panel.
 * @private
 */
visflow.nodePanel.hide_ = function() {
  var content = visflow.nodePanel.container_.find('.content');
  var width = visflow.nodePanel.getWidth_();
  visflow.nodePanel.container_.stop()
    .css({
      left: 0
    })
    .animate({
      left: -width
    }, {
      duration: visflow.nodePanel.TRANSITION_DURATION_,
      complete: function() {

      }
    });
};


/**
 * Initializes the panel element interactions.
 * @private
 */
visflow.nodePanel.initPanel_ = function() {
  visflow.nodePanel.container_.find('.panel-button').tooltip({
    delay: visflow.nodePanel.TOOLTIP_DELAY_
  });

  visflow.nodePanel.container_.find('.panel-button')
    .each(function(index, button) {
      visflow.nodePanel.initButton_($(button));
    });
};

/**
 * Initializes the panel button.
 * @param {!jQuery} button
 * @private
 */
visflow.nodePanel.initButton_ = function(button) {
  var create = function (event) {
    var node = visflow.flow.createNode(button.attr('id'));

    $(node).on('visflow.ready', function() {
      node.container.css(_({
        left: visflow.interaction.mouseX - node.container.width() / 2,
        top: visflow.interaction.mouseY - node.container.height() / 2
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
    helper: 'clone',
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
