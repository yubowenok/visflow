/**
 * @fileoverview Interaction manager tracking mouse actions.
 */

/** @const */
visflow.interaction = {};

/** @enum {number} */
visflow.interaction.keyCodes = {
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  ESC: 27,
  HOME: 36,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  LEFT_MOUSE: 1,
  RIGHT_MOUSE: 3,
  S: 83
};

/** @type {number} */
visflow.interaction.mouseX = 0;
/** @type {number} */
visflow.interaction.mouseY = 0;
/** @private @const {number} */
visflow.interaction.MOVE_DELTA_ = 50;

/** @private {!Array<visflow.contextMenu.Item>} */
visflow.interaction.MAIN_CONTEXTMENU_ITEMS_ = [
  {
    id: 'addNode',
    text: 'Add Node',
    icon: 'glyphicon glyphicon-plus',
    hotKey: 'A'
  },
  /*
  {
    id: 'flowSense',
    text: 'FlowSense',
    icon: 'glyphicon glyphicon-comment',
    hotKey: 'S'
  }
  */
];

/** @private {!jQuery} */
visflow.interaction.mainContainer_ = $();

/** @type {visflow.ContextMenu|undefined} */
visflow.interaction.contextMenu = undefined;

/** @type {string} */
visflow.interaction.mouseMode = '';

/** @private {boolean} */
visflow.interaction.altHold_ = false;

/**
 * @type {{
 *   port: (!visflow.Port|undefined)
 * }}
 */
visflow.interaction.dragstartParams = {};

/** @type {visflow.Vector} */
visflow.interaction.dragstartPos = [];
/** @type {visflow.Vector} */
visflow.interaction.draglastPos = [];
/** @type {visflow.Vector} */
visflow.interaction.dragstopPos = [];
/** @type {visflow.Vector} */
visflow.interaction.mousedownPos = [];
/** @type {visflow.Vector} */
visflow.interaction.mouseupPos = [];
/** @type {visflow.Vector} */
visflow.interaction.mouselastPos = [];

/** @type {boolean} */
visflow.interaction.dropPossible = false;

/**
 * Initializes the interaction manager.
 */
visflow.interaction.init = function() {
  visflow.interaction.mouseMode = '';  // node, port, selectbox

  visflow.interaction.dragstartPos = [0, 0];
  visflow.interaction.draglastPos = [0, 0];
  visflow.interaction.dragstopPos = [0, 0];

  visflow.interaction.dragstartParams = {};
  visflow.interaction.dragstopParams = {};
  visflow.interaction.dropPossible = false;

  visflow.interaction.mousedownPos = [0, 0];
  visflow.interaction.mouseupPos = [0, 0];
  visflow.interaction.mouselastPos = [0, 0];

  visflow.interaction.mainContainer_ = $('#main');

  visflow.interaction.selectbox = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0
  };

  visflow.interaction.mainContextMenu_();
  visflow.interaction.trackMousemove();
  visflow.interaction.interaction();
  visflow.interaction.contextMenuClickOff();
  visflow.interaction.systemMessageClickOff();

  /** @type {!visflow.Edge} */
  visflow.interaction.edgeDrawing = new visflow.Edge({
    container: $('#edge-drawing')
  });
};

/**
 * Whether SHIFT key is pressed.
 * @type {boolean}
 */
visflow.interaction.shifted = false;

/**
 * Whether CTRL key is pressed.
 * @type {boolean}
 */
visflow.interaction.ctrled = false;

/**
 * Blocks interaction for visualization. This is set to false when user presses
 * CTRL so as to force node move.
 * @type {boolean}
 */
visflow.interaction.visualizationBlocking = true;

/**
 * Handles contextmenu click off.
 */
visflow.interaction.contextMenuClickOff = function() {
  $('body').click(function() {
    visflow.contextMenu.hide();
  });
  $('body').on('click', '.node, #edge', function() {
    visflow.contextMenu.hide();
  });
};

/**
 * Handles system message click off.
 */
visflow.interaction.systemMessageClickOff = function() {
  $('.visflow').on('click', '.system-message > .close', function() {
    $(this).parent().slideUp();
  });
};

/**
 * Enables/disables up the mouse movement tracking.
 * @param {boolean=} opt_enabled
 */
visflow.interaction.trackMousemove = function(opt_enabled) {
  var enabled = opt_enabled == null ? true : opt_enabled;
  var main = $('#main');
  if (enabled) {
    main.mousemove(function(event) {
      visflow.interaction.mouseX = event.pageX;
      visflow.interaction.mouseY = event.pageY;
    });
  } else {
    main.off('mousemove');
  }
};

/**
 * Toggles the alt hold state.
 */
visflow.interaction.toggleAltHold = function() {
  visflow.interaction.altHold_ = !visflow.interaction.altHold_;
  visflow.signal(visflow.interaction, 'alt');
};

/**
 * Checks if a given key is pressed.
 * @param {visflow.interaction.keyCodes} key
 * @return {boolean}
 */
visflow.interaction.isPressed = function(key) {
  var keyCodes = visflow.interaction.keyCodes;
  switch (key) {
    case keyCodes.ALT:
      return visflow.interaction.isAlted();
    case keyCodes.SHIFT:
      return visflow.interaction.shifted;
    case keyCodes.CTRL:
      return visflow.interaction.ctrled;
    default:
      visflow.error('unknown key code', key);
  }
  return false;
};

/**
 * Checks if alt is pressed.
 * @return {boolean}
 */
visflow.interaction.isAlted = function() {
  return visflow.interaction.altHold_ || visflow.interaction.alted;
};

/**
 * Handles key release event, called after a shift/ctrl terminating event (e.g.
 * node drag). If not called, browser might fail to capture shift/ctrl release
 * and the two keys would be considered pressed forever.
 * @param {visflow.interaction.keyCodes|
 *   !Array<visflow.interaction.keyCodes>} key
 */
visflow.interaction.keyRelease = function(key) {
  if (!(key instanceof Array)) {
    key = [key];
  }
  key.forEach(function(key) {
    var keyCodes = visflow.interaction.keyCodes;
    switch (key) {
      case keyCodes.SHIFT:
        visflow.interaction.shifted = false;
        visflow.interaction.mainContainer_.css('cursor', '');
        break;
      case keyCodes.ALT:
        visflow.interaction.alted = false;
        visflow.signal(visflow.interaction, 'alt');
        visflow.interaction.visualizationBlocking = true;
        visflow.interaction.mainContainer_.css('cursor', '');
        break;
      case keyCodes.CTRL:
        visflow.interaction.ctrled = false;
        break;
    }
  });
};

/**
 * Prepares global interaction handlers.
 */
visflow.interaction.interaction = function() {
  visflow.interaction.jqselectbox = $('#selectbox');
  visflow.interaction.jqselectbox.hide();
  visflow.interaction.mainContainer_
    .mousedown(function(event) {
      if ($(event.target).is('#edges')) {
        visflow.interaction.mousedownHandler({
          type: 'background',
          event: event
        });
      }
    })
    .mousemove(function(event) {
      visflow.interaction.mousemoveHandler({
        type: 'background',
        event: event
      });
    })
    .mouseup(function(event) {
      visflow.interaction.mouseupHandler({
        type: 'background',
        event: event
      });
    });

  $(document).keydown(function(event) {
    visflow.interaction.keyPress(event);
  });
  $(document).keyup(function(event) {
    visflow.interaction.keyRelease(/** @type {visflow.interaction.keyCodes} */(
      event.keyCode));
  });

  $(document).mousewheel(function(event) {
    // TODO(bowen): zoom in view ?
  });

  $('#main').droppable({
    disabled: true
  });
};

/**
 * Handles global key press event.
 * @param {!jQuery.Event} event
 * @return {boolean}
 */
visflow.interaction.keyPress = function(event) {
  var code = event.keyCode;

  // Avoid interfering with input and editable.
  // TODO(bowen): Check interaction logic. Is it okay to do it globally?
  if ($(event.target).is('input, #node-label, textarea')) {
    return true;
  }

  var keyCodes = visflow.interaction.keyCodes;
  switch (code) {
    case keyCodes.UP:
    case keyCodes.DOWN:
    case keyCodes.LEFT:
    case keyCodes.RIGHT:
      var index = [keyCodes.UP, keyCodes.DOWN, keyCodes.LEFT, keyCodes.RIGHT]
        .indexOf(code);
      var shift = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      visflow.flow.moveNodes(
        shift[index][0] * visflow.interaction.MOVE_DELTA_,
        shift[index][1] * visflow.interaction.MOVE_DELTA_,
        visflow.flow.nodes
      );
      break;
    case keyCodes.SHIFT:
      visflow.interaction.shifted = true;
      visflow.interaction.mainContainer_.css('cursor', 'crosshair');
      break;
    case keyCodes.ALT:
      visflow.interaction.alted = true;
      visflow.signal(visflow.interaction, 'alt');
      visflow.interaction.visualizationBlocking = false;
      break;
    case keyCodes.CTRL:
      visflow.interaction.ctrled = true;
      break;
    case keyCodes.ESC:
      visflow.interaction.escHandler();
      break;
    default:
      var c = String.fromCharCode(code);
      var key = c;
      if (visflow.interaction.shifted) {
        key = 'shift+' + key;
      }
      if (visflow.interaction.ctrled) {
        key = 'ctrl+' + key;
      }
      if (visflow.interaction.alted) {
        key = 'alt+' + key;
      }
      switch (key) {
        case 'A':
          event.pageX = visflow.interaction.mouseX;
          event.pageY = visflow.interaction.mouseY;
          if (!visflow.flow.visMode) {
            visflow.popupPanel.show(event, true);
          }
          break;
        case 'shift+L':
          visflow.flow.autoLayoutAll();
          break;
        /*
        case 'shift+S':
          // prevent 'S' from being entered into the nlp input
          event.preventDefault();
          visflow.nlp.input();
          break;
        */
        case 'shift+V':
          visflow.flow.toggleVisMode();
          break;
        case 'shift+T':
          visflow.nlp.toggleSpeech();
          break;
        case 'shift+D':
          // Debug only
          for (var id in visflow.flow.nodesSelected) {
            var node = visflow.flow.nodes[id];
            console.log(node);
            visflow.debug = node;
          }
          break;
        case 'P':
          if (visflow.optionPanel.isOpen) {
            visflow.optionPanel.toggle(false);
          } else {
            visflow.optionPanel.toggle(true);
            if (visflow.flow.lastSelectedNode) {
              visflow.flow.lastSelectedNode.panel();
            }
          }
          break;
        default:
          // Not global interaction event, pass to flow.
          visflow.flow.keyAction(key, event);
      }
  }
  return true;
};

/**
 * Prepares canvas contextMenu for '#main'.
 * @private
 */
visflow.interaction.mainContextMenu_ = function() {
  var contextMenu = new visflow.ContextMenu({
    container: visflow.interaction.mainContainer_,
    items: visflow.interaction.MAIN_CONTEXTMENU_ITEMS_
  });
  $(contextMenu)
    .on('vf.addNode', function() {
      visflow.popupPanel.show();
    })
    .on('vf.flowSense', function() {
      visflow.nlp.input();
    });
};

/**
 * Handles mouse down event.
 * @param {!Object} params
 * @return {boolean}
 */
visflow.interaction.mousedownHandler = function(params) {
  var type = params.type,
      event = params.event;
  visflow.interaction.mousedownPos = [event.pageX, event.pageY];
  visflow.interaction.mouselastPos = [event.pageX, event.pageY];

  if (visflow.interaction.mouseMode != '') {
    return true;
  }
  if (event.which == visflow.interaction.keyCodes.RIGHT_MOUSE) {
    return true;
  }

  if (type == 'background') {

    // Also decrease activeness when user is navigating.
    visflow.flow.iterateActiveness();

    if (!visflow.interaction.alted) {
      visflow.interaction.mouseMode = 'pan';
      visflow.interaction.mainContainer_.css('cursor', 'move');
    } else {
      visflow.interaction.selectbox.x1 = event.pageX;
      visflow.interaction.selectbox.y1 = event.pageY;
      visflow.interaction.mouseMode = 'selectbox';
    }
  } else if (type == 'node') {
    visflow.interaction.mouseMode = 'node';
  }
  return true;
};

/**
 * Handles mouse move event.
 * @param {!Object} params
 */
visflow.interaction.mousemoveHandler = function(params) {
  var type = params.type,
      event = params.event;
  //if (this.mouseMode != type)
  //  return;

  if (type == 'background') {
    if (visflow.interaction.mouseMode == 'pan') {
      var dx = event.pageX - visflow.interaction.mouselastPos[0],
          dy = event.pageY - visflow.interaction.mouselastPos[1];
      visflow.nlp.end();
      visflow.flow.moveNodes(dx, dy, visflow.flow.nodes);
    } else if (visflow.interaction.mouseMode == 'selectbox') {
      var selectbox = visflow.interaction.selectbox;
      selectbox.x2 = event.pageX;
      selectbox.y2 = event.pageY;
      var w = Math.abs(selectbox.x2 - selectbox.x1),
          h = Math.abs(selectbox.y2 - selectbox.y1),
          l = Math.min(selectbox.x1, selectbox.x2),
          t = Math.min(selectbox.y1, selectbox.y2);
      var box = {
          width: w,
          height: h,
          left: l,
          top: t
      };
      visflow.interaction.jqselectbox
        .css(box)
        .show();
      var hovered = visflow.flow.getNodesInSelectbox(box);
      visflow.flow.clearNodeHover();
      visflow.flow.addNodeHover(hovered);
      visflow.nlp.end();
    }
  }
  visflow.interaction.mouselastPos = [event.pageX, event.pageY];
};

/**
 * Handles mouse up event.
 * @param {!Object} params
 */
visflow.interaction.mouseupHandler = function(params) {
  var type = params.type,
      event = params.event;
  visflow.interaction.mouseupPos = [event.pageX, event.pageY];
  var dx = visflow.interaction.mouseupPos[0] -
    visflow.interaction.mousedownPos[0];
  var dy = visflow.interaction.mousedownPos[1] -
    visflow.interaction.mousedownPos[1];
  visflow.interaction.mouseMoved = Math.abs(dx) + Math.abs(dy) > 0;

  if (visflow.interaction.mouseMode == 'selectbox') {
    visflow.interaction.jqselectbox.hide();
    if (visflow.interaction.alted) {  // not panning, then selecting
      if (!visflow.interaction.shifted) {
        visflow.flow.clearNodeSelection();
      }
      visflow.flow.addHoveredToSelection();
    }
  } else {
    if (type == 'background') {
      if (visflow.interaction.mouseMode == 'pan') {
        if (!visflow.interaction.mouseMoved) {
          // mouse not moved for select box
          // trigger empty click
          visflow.interaction.clickHandler({
            type: 'empty',
            event: event
          });
        }
        visflow.interaction.mainContainer_.css('cursor', '');
      }
    } else if (type == 'node') {
      if (!visflow.interaction.mouseMoved) {
        if (!visflow.interaction.shifted) {
          visflow.flow.clearNodeSelection();
        }
        visflow.flow.addNodeSelection(params.node);
      }
    }
  }

  // Forcefully end all interactions to prevent inconsistent interaction states
  // resulting from an un-captured key release event.
  if (visflow.interaction.alted) {
    visflow.interaction.keyRelease(visflow.interaction.keyCodes.ALT);
  }
  if (visflow.interaction.shifted) {
    visflow.interaction.keyRelease(visflow.interaction.keyCodes.SHIFT);
  }

  //visflow.viewManager.clearEdgeHover();
  visflow.popupPanel.hide();

  visflow.interaction.mouseMode = '';
};

/**
 * Handles drag start event.
 * @param {{type: string, event: !jQuery.Event}} params
 */
visflow.interaction.dragstartHandler = function(params) {
  var type = params.type,
      event = params.event;

  visflow.interaction.dragstartParams = params;
  if (type == 'port') {
    visflow.interaction.mouseMode = 'port';
    var jqtarget = $(params.event.target);
    var offset = visflow.utils.offsetMain(jqtarget);
    var x = offset.left + jqtarget.outerWidth() / 2,
        y = offset.top + jqtarget.outerHeight() / 2;
    visflow.interaction.dragstartPos = [x, y];
    visflow.interaction.dropPossible = true;
  }
  else if (type == 'node') {
    visflow.interaction.mouseMode = 'node';
    visflow.interaction.mainContainer_.css('cursor', 'move');

    if (visflow.flow.isNodeSelected(params.node)) {
      // already selected, then drag all selection
    } else {
      // make a new exclusive selection
      visflow.flow.clearNodeSelection();
      visflow.flow.addNodeSelection(params.node);
    }
  }
  visflow.interaction.draglastPos = [event.pageX, event.pageY];
};

/**
 * Handles dragging movement event.
 * @param {{type: string, event: !jQuery.Event}} params
 */
visflow.interaction.dragmoveHandler = function(params) {
  var type = params.type,
      event = params.event;
  visflow.interaction.dragstopPos = [params.event.pageX, params.event.pageY];

  if (visflow.interaction.mouseMode != type) {
    return;
  }

  if (type == 'port') {
    var dx = visflow.interaction.dragstopPos[0] -
      visflow.interaction.dragstartPos[0];
    var dy = visflow.interaction.dragstopPos[1] -
      visflow.interaction.dragstartPos[1];

    var pos = params.port.isInput ? visflow.interaction.dragstopPos :
      visflow.interaction.dragstartPos;
    var rpos = !params.port.isInput ? visflow.interaction.dragstopPos :
      visflow.interaction.dragstartPos;

    visflow.interaction.edgeDrawing.show();
    visflow.interaction.edgeDrawing
      .drawLinear(pos[0], pos[1], rpos[0], rpos[1]);
  } else if (type == 'node') {
    var dx = event.pageX - visflow.interaction.draglastPos[0],
        dy = event.pageY - visflow.interaction.draglastPos[1];

    // The dragged node is moving together (with more offset).
    // The more offset will be reset immediately by jquery draggable however.

    // delta & nodes
    visflow.flow.moveNodes(dx, dy, visflow.flow.nodesSelected);
    visflow.interaction.draglastPos = [event.pageX, event.pageY];
  }
};

/**
 * Handles drag stop event.
 * @param {{type: string, event: !jQuery.Event}} params
 */
visflow.interaction.dragstopHandler = function(params) {
  var type = params.type;
  var event = params.event;
  visflow.interaction.dragstopParams = params;
  visflow.interaction.dragstopPos = [event.pageX, event.pageY];
  if (type == 'port') {
    visflow.interaction.edgeDrawing.hide();
  } else if (type == 'node') {
    visflow.interaction.mainContainer_.css('cursor', '');
  }
  visflow.interaction.mouseMode = '';
};

/**
 * Handles drop event.
 * @param {{type: string, event: !jQuery.Event}} params
 */
visflow.interaction.dropHandler = function(params) {
  var type = params.type;

  if (visflow.interaction.dropPossible) {
    if (type == 'port') {
      // connect ports
      var port1 = visflow.interaction.dragstartParams.port,
          port2 = params.port;
      // always connect from out to in
      port1.isInput ? visflow.flow.createEdge(port2, port1) :
        visflow.flow.createEdge(port1, port2);
    } else if (type == 'node') {
      var port1 = visflow.interaction.dragstartParams.port;
      var port2 = params.node.firstConnectable(port1);
      if (port2 != null) {
        // always connect from out to in
        port1.isInput ? visflow.flow.createEdge(port2, port1) :
          visflow.flow.createEdge(port1, port2);
      } else {
        // Show error message.
        visflow.tooltip.create('No connectable port available');
      }
    }
    // prevent dropped on overlapping droppable
    visflow.interaction.dropPossible = false;
  }
};

/**
 * Handles mouse clicks.
 * @param {{type: string, event: !jQuery.Event}} params
 */
visflow.interaction.clickHandler = function(params) {
  var type = params.type;
  if (type == 'empty') {
    visflow.flow.backgroundClearSelection();
    $('input').blur();
  }
};

/**
 * Handles ESC key press.
 */
visflow.interaction.escHandler = function() {
  visflow.flow.clearNodeSelection();
  visflow.popupPanel.hide();
  visflow.dialog.close();
  visflow.nlp.end();
};
