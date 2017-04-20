/**
 * @fileoverview VisFlow panel for adding nodes.
 */

/** @const */
visflow.nodePanel = {};

/**
 * Node panel container.
 * @private {!jQuery}
 */
visflow.nodePanel.container_ = $();

/**
 * Node panel hover area.
 * @private {!jQuery}
 */
visflow.nodePanel.hoverArea_ = $();

/**
 * Node panel state.
 * @type {boolean}
 */
visflow.nodePanel.isOpen = false;

/** @private @const {string} */
visflow.nodePanel.TEMPLATE_ = './dist/html/panel/node-panel/node-panel.html';
/** @private @const {number} */
visflow.nodePanel.TRANSITION_DURATION_ = 50;
/** @private @const {number} */
visflow.nodePanel.INIT_DELAY_ = 50;

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
  //container.find('#btn-toggle').mouseenter(showPanel);
  //visflow.nodePanel.hoverArea_.mouseenter(showPanel);

  visflow.nodePanel.initUpdateHandlers_();
  // Set correct panel with on system init
  visflow.nodePanel.show_();
  setTimeout(visflow.nodePanel.hide_, visflow.nodePanel.INIT_DELAY_);
};

/**
 * Creates event listeners for system events.
 * @private
 */
visflow.nodePanel.initUpdateHandlers_ = function() {
  $(visflow.flow).on('vf.visMode', function() {
    visflow.nodePanel.updateVisMode_();
  });
};

/**
 * Sets the visibility of the node panel.
 * @param {boolean} visible
 * @private
 */
visflow.nodePanel.setVisible_ = function(visible) {
  visflow.nodePanel.container_.toggle(visible);
};

/**
 * Toggles the node panel.
 * @param {boolean=} opt_state Whether the panel shall be open.
 */
visflow.nodePanel.toggle = function(opt_state) {
  // TODO(bowen): Completely disable node panel toggle.
  return;
  /*
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
  */
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
  // TODO(bowen): Completely disable node panel show.
  var content = visflow.nodePanel.container_.find('.content');
  content.load(visflow.nodePanel.TEMPLATE_, function() {
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
  // TODO(bowen): Completely disable node panel hide.
  return;
  /*
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
    */
};


/**
 * Initializes the panel element interactions.
 * @private
 */
visflow.nodePanel.initPanel_ = function() {
  visflow.nodePanel.container_.find('.panel-button').tooltip({
    delay: visflow.panel.TOOLTIP_DELAY
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
    helper: 'clone',
    start: function() {
      // Create a temporary droppable under #main so that we cannot drop
      // the button to panel.
      var panelOffset = visflow.utils.offsetMain(
        visflow.nodePanel.container_);
      $('<div></div>')
        .addClass('dropzone-temp')
        .css({
          width: visflow.nodePanel.container_.width(),
          height: visflow.nodePanel.container_.height(),
          left: panelOffset.left,
          top: panelOffset.top
        })
        .droppable({
          accept: '.panel-button',
          // Prevent #main be dropped at the same time
          greedy: true,
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

/**
 * Shows/hides the node creation panel according to visMode on/off.
 * @private
 */
visflow.nodePanel.updateVisMode_ = function() {
  visflow.nodePanel.setVisible_(!visflow.flow.visMode);
};
