/**
 * @fileoverview Interaction manager tracking mouse actions.
 */

'use strict';

/** @const */
visflow.interaction = {};

/** @enum {number} */
visflow.interaction.keyCodes = {
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ESC: 27,
  HOME: 36,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  LEFT_MOUSE: 1,
  RIGHT_MOUSE: 3
};

/** @type {number} */
visflow.interaction.mouseX = 0;
/** @type {number} */
visflow.interaction.mouseY = 0;
/** @private @const {number} */
visflow.interaction.MOVE_DELTA_ = 50;

/** @private {!Array<!visflow.contextMenu.Item>} */
visflow.interaction.MAIN_CONTEXTMENU_ITEMS_ = [
  {id: 'add-node', text: 'Add Node', icon: 'glyphicon glyphicon-plus'}
];

/** @private {!jQuery} */
visflow.interaction.mainContainer_;

/** @type {visflow.ContextMenu} */
visflow.interaction.contextMenu;

/** @type {string} */
visflow.interaction.mouseMode = '';

/**
 * Initializes the interaction manager.
 */
visflow.interaction.init = function() {
  visflow.interaction.mouseMode = '';  // node, port, selectbox

  visflow.interaction.dragstartPos = [0, 0];
  visflow.interaction.draglastPos = [0, 0];
  visflow.interaction.dragstopPos = [0, 0];
  visflow.interaction.dragstartPara = {};
  visflow.interaction.dragstopPara = {};
  visflow.interaction.dropPossible = false;

  visflow.interaction.mousedownPos = [0, 0];
  visflow.interaction.mouseupPos = [0, 0];
  visflow.interaction.mouselastPos = [0, 0];

  visflow.interaction.mainContainer_ =  $('#main');

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
    main.mousemove(function(event){
      visflow.interaction.mouseX = event.pageX;
      visflow.interaction.mouseY = event.pageY;
    });
  } else {
    main.off('mousemove');
  }
};

/**
 * Handles key release event, called after a shift/ctrl terminating event (e.g.
 * node drag). If not called, browser might fail to capture shift/ctrl release
 * and the two keys would be considered pressed forever.
 */
visflow.interaction.keyRelease = function(key) {
  if (!(key instanceof Array)) {
    key = [key];
  }
  key.map(function(key){
    if (key == 'shift') {
      this.shifted = false;
      visflow.interaction.mainContainer_.css('cursor', '');
    }
    else if (key == 'ctrl') {
      this.ctrled = false;
      visflow.interaction.mainContainer_.css('cursor', '');
      this.visualizationBlocking = true;
    }
  }, this);
};

/**
 * Prepares global interaction handlers.
 */
visflow.interaction.interaction = function() {
  this.jqselectbox = $('#selectbox');
  this.jqselectbox.hide();
  visflow.interaction.mainContainer_
    .mousedown(function(event) {
      if ($(event.target).is('#main')) {
        this.mousedownHandler({
          type: 'background',
          event: event
        });
      }
    }.bind(this))
    .mousemove(function(event, ui) {
      this.mousemoveHandler({
        type: 'background',
        event: event
      });
    }.bind(this))
    .mouseup(function(event, ui) {
      this.mouseupHandler({
        type: 'background',
        event: event
      });
    }.bind(this));

  // track keyboard: shift key
  $(document).keydown(this.keyPress);

  $(document).keyup(function(event) {
    if (event.keyCode == visflow.interaction.keyCodes.SHIFT) {
      visflow.interaction.keyRelease('shift');
    } else if (event.keyCode == visflow.interaction.keyCodes.CTRL) {
      visflow.interaction.keyRelease('ctrl');
    }
  });

  $(document).mousewheel(function(event) {
    // TODO : zoom in view ?
  });

  $('#main').droppable({
    disabled: true
  });
};

/**
 * Handles global key press event.
 * @private
 */
visflow.interaction.keyPress = function(event) {
  var code = event.keyCode;

  // Avoid interfering with input and editable.
  if ($(event.target).is('input, #node-label')) {
    return true;
  }

  var keyCodes = visflow.interaction.keyCodes;
  switch(code) {
    case keyCodes.UP:
    case keyCodes.DOWN:
    case keyCodes.LEFT:
    case keyCodes.RIGHT:
      var index = [keyCodes.UP, keyCodes.DOWN, keyCodes.LEFT, keyCodes.RIGHT]
        .indexOf(code);
      var shift = [[0, -1], [0, 1], [-1, 0], [1, 0]];
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
    case keyCodes.CTRL:
      visflow.interaction.ctrled = true;
      visflow.interaction.visualizationBlocking = false;
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
      switch(key) {
        case 'A':
          event.pageX = visflow.interaction.mouseX;
          event.pageY = visflow.interaction.mouseY;
          visflow.popupPanel.show(event, true); // compact mode
          break;
        case 'shift+A':
          event.pageX = visflow.interaction.mouseX;
          event.pageY = visflow.interaction.mouseY;
          visflow.popupPanel.show(event);
          break;
        case 'shift+V':
          visflow.flow.toggleVisMode();
          break;
        case 'P':
          if (visflow.optionPanel.isOpen) {
            visflow.optionPanel.toggle(false);
          } else {
            if (visflow.flow.lastSelectedNode) {
              visflow.flow.lastSelectedNode.panel();
            } else {
              visflow.optionPanel.toggle(true);
            }
          }
          break;
        default:
          if (visflow.viewManager.getPopupPanelName() == 'add') {
            // Further filtering popup entries
            visflow.viewManager.filterAddPanel(key);
          } else {
            // Not global interaction event, pass to flow.
            visflow.flow.keyAction(key, event);
          }
      }
  }
};

/**
 * Prepares canvas contextMenu for '#main'.
 * @private
 */
visflow.interaction.mainContextMenu_ = function() {
  visflow.interaction.contextMenu = new visflow.ContextMenu({
    container: visflow.interaction.mainContainer_,
    items: visflow.interaction.MAIN_CONTEXTMENU_ITEMS_
  });
};

/**
 * Handles mouse down event.
 * @param {!Object} params
 */
visflow.interaction.mousedownHandler = function(params) {
  var type = params.type,
      event = params.event;
  this.mousedownPos = [event.pageX, event.pageY];
  this.mouselastPos = [event.pageX, event.pageY];

  if (this.mouseMode != '') {
    return true;
  }

  if (type == 'background') {
    if (!this.ctrled) {
      this.mouseMode = 'pan';
      visflow.interaction.mainContainer_.css('cursor', 'move');
    } else {
      this.selectbox.x1 = event.pageX;
      this.selectbox.y1 = event.pageY;
      this.mouseMode = 'selectbox';
    }
  } else if (type == 'node') {
    this.mouseMode = 'node';
  }
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
    if (this.mouseMode == 'pan') {
      var dx = event.pageX - this.mouselastPos[0],
          dy = event.pageY - this.mouselastPos[1];
      visflow.flow.moveNodes(dx, dy, visflow.flow.nodes);
    }
    else if (this.mouseMode == 'selectbox') {
      this.selectbox.x2 = event.pageX;
      this.selectbox.y2 = event.pageY;
      var w = Math.abs(this.selectbox.x2 - this.selectbox.x1),
          h = Math.abs(this.selectbox.y2 - this.selectbox.y1),
          l = Math.min(this.selectbox.x1, this.selectbox.x2),
          t = Math.min(this.selectbox.y1, this.selectbox.y2);
      var box = {
          width: w,
          height: h,
          left: l,
          top: t
      };
      this.jqselectbox
        .css(box)
        .show();
      var hovered = visflow.flow.getNodesInSelectbox(box);
      visflow.flow.clearNodeHover();
      visflow.flow.addNodeHover(hovered);
    }
  }
  this.mouselastPos = [event.pageX, event.pageY];
};

/**
 * Handles mouse up event.
 * @param {!Object} params
 */
visflow.interaction.mouseupHandler = function(params) {
  var type = params.type,
      event = params.event;
  this.mouseupPos = [event.pageX, event.pageY];
  var dx = this.mouseupPos[0] - this.mousedownPos[0],
      dy = this.mousedownPos[1] - this.mousedownPos[1];
  this.mouseMoved = Math.abs(dx) + Math.abs(dy) > 0;

  if (type == 'background') {
    if (this.mouseMode == 'pan') {
      if (!this.mouseMoved){
        // mouse not moved for select box
        // trigger empty click
        this.clickHandler({
          type: 'empty',
          event: event
        });
      }
      visflow.interaction.mainContainer_.css('cursor', '');
    } else if (this.mouseMode == 'selectbox') {
      this.jqselectbox.hide();
      if (this.ctrled) {  // not panning, then selecting
        if (!this.shifted) {
          visflow.flow.clearNodeSelection();
        }
        visflow.flow.addHoveredToSelection();
      }
    }
  } else if (type == 'node') {
    if (!this.mouseMoved) {
      if (!this.shifted) {
        visflow.flow.clearNodeSelection();
      }
      visflow.flow.addNodeSelection(params.node);
    }
  }

  // forcefully end all interactions
  // to prevent inconsistent interaction states resulting from an uncaptured event
  this.keyRelease(['shift', 'ctrl']);
  visflow.viewManager.clearEdgeHover();
  visflow.popupPanel.hide();

  this.mouseMode = '';
};

/**
 * Handles drag start event.
 * @param params
 */
visflow.interaction.dragstartHandler = function(params) {
  var type = params.type,
      event = params.event;

  this.dragstartPara = params;
  if (type == 'port') {
    this.mouseMode = 'port';
    var jqtarget = $(params.event.target);
    var offset = visflow.utils.offsetMain(jqtarget);
    var x = offset.left + jqtarget.outerWidth() / 2,
        y = offset.top + jqtarget.outerHeight() / 2;
    this.dragstartPos = [x, y];
    this.dropPossible = true;
  }
  else if (type == 'node') {
    this.mouseMode = 'node';
    visflow.interaction.mainContainer_.css('cursor', 'move');

    if (visflow.flow.isNodeSelected(params.node)) {
      // already selected, then drag all selection
    } else {
      // make a new exclusive selection
      visflow.flow.clearNodeSelection();
      visflow.flow.addNodeSelection(params.node);
    }
  }
  this.draglastPos = [event.pageX, event.pageY];
};

/**
 * Handles dragging movement event.
 * @param params
 */
visflow.interaction.dragmoveHandler = function(params) {
  var type = params.type,
      event = params.event;
  this.dragstopPos = [params.event.pageX, params.event.pageY];

  if (this.mouseMode != type) {
    return;
  }

  if (type == 'port') {
    var dx = this.dragstopPos[0] - this.dragstartPos[0],
        dy = this.dragstopPos[1] - this.dragstartPos[1];

    var jqsegment = $('#edge-drawing > .edge-segment'),
        jqarrow = $('#edge-drawing > .edge-arrow');
    var hseg = 3,
        harrow = 9;

    var pos = params.port.isInPort ? this.dragstopPos : this.dragstartPos,
        rpos = !params.port.isInPort ? this.dragstopPos : this.dragstartPos;
    if (params.port.isInPort) {
      dx = -dx;
      dy = -dy;
      jqsegment
        .css('left', pos[0] - hseg / 2)
        .css('top', pos[1] - hseg / 2);
    } else {
      jqsegment
        .css('left', pos[0] - hseg / 2)
        .css('top', pos[1] - hseg / 2);
    }
    var length = Math.sqrt(dx * dx + dy * dy) - 10;
    var angle = Math.atan2(dy, dx);
    //console.log(angle);
    jqsegment
      .css({
        width: length,
        transform: 'rotate('+ angle +'rad)'
      });
    jqarrow
      .css({
        transform: 'rotate('+ angle +'rad)'
      });
    jqarrow
      .css({
        left: rpos[0] - 20 * Math.cos(angle),
        top: rpos[1] - 20 * Math.sin(angle) - harrow / 2,
      });

    $('#edge-drawing')
      .css('visibility', 'visible');
  }
  else if (type == 'node') {
    var dx = event.pageX - this.draglastPos[0],
        dy = event.pageY - this.draglastPos[1];

    // the dragged node is moving together (with more offset)
    // the more offset will be reset immediately by jquery draggable however
    visflow.flow.moveNodes(dx, dy, visflow.flow.nodesSelected);  // delta & nodes
    this.draglastPos = [event.pageX, event.pageY];
  }
};

/**
 * Handles drag stop event.
 * @param params
 */
visflow.interaction.dragstopHandler = function(params) {
  var type = params.type;
  var event = params.event;
  this.dragstopPara = params;
  this.dragstopPos = [event.pageX, event.pageY];
  if (type == 'port') {
    $('#edge-drawing')
      .css('visibility', 'hidden');
  }
  else if (type == 'node'){
    visflow.interaction.mainContainer_.css('cursor', '');
  }
  this.mouseMode = '';
};

/**
 * Handles drop event.
 * @param params
 */
visflow.interaction.dropHandler = function(params) {
  var type = params.type,
      event = params.event;

  if (this.dropPossible) {
    if (type == 'port') {
      // connect ports
      var port1 = this.dragstartPara.port,
          port2 = params.port;
      if (port1.isInPort) {
        // always connect from out to in, swap
        var porttmp = port1;
        port1 = port2;
        port2 = porttmp;
      }
      visflow.flow.createEdge(port1, port2);
    } else if (type == 'node') {
      var port1 = this.dragstartPara.port,
          port2 = params.node.firstConnectable(port1);
      if (port2 != null) {
        if (port1.isInPort) {
          // always connect from out to in, swap
          var porttmp = port1;
          port1 = port2;
          port2 = porttmp;
        }
        visflow.flow.createEdge(port1, port2);
      } else {
        // show error message
        visflow.viewManager.tip('No connectable port available');
      }
    }
    this.dropPossible = false; // prevent dropped on overlapping droppable
  }
};

/**
 * Handles mouse clicks.
 * @param params
 */
visflow.interaction.clickHandler = function(params) {
  var type = params.type,
      event = params.event;
  if (type == 'empty') {
    visflow.flow.clearNodeSelection();
    $('input').blur();
  }
};

/**
 * Handles ESC key press.
 */
visflow.interaction.escHandler = function() {
  visflow.flow.clearNodeSelection();
  visflow.popupPanel.close();
  visflow.dialog.close();
};
