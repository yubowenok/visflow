/**
 * @fileoverview Interaction manager tracking mouse actions.
 */

'use strict';

/** @const */
visflow.interaction = {};

/** @enum {number} */
visflow.interaction.keyCodes = {
  SHIFT: 16,
  CTRL: 17,
  ESC: 27
};

/** @type {number} */
visflow.interaction.mouseX = 0;
/** @type {number} */
visflow.interaction.mouseY = 0;

/** @private {!Array<!visflow.contextMenu.Item>} */
visflow.interaction.MAIN_CONTEXTMENU_ITEMS_ = [
  {id: 'add-node', text: 'Add Node', icon: 'glyphicon glyphicon-plus'}
];

/**
 * Initializes the interaction manager.
 */
visflow.interaction.init = function() {
  this.mouseMode = 'none';  // node, port, selectbox

  this.dragstartPos = [0, 0];
  this.draglastPos = [0, 0];
  this.dragstopPos = [0, 0];
  this.dragstartPara = {};
  this.dragstopPara = {};
  this.dropPossible = false;

  this.mousedownPos = [0, 0];
  this.mouseupPos = [0, 0];
  this.mouselastPos = [0, 0];

  this.mainContainer = $('#main');
  this.selectbox = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0
  };
  visflow.interaction.mainContextMenu_();
  visflow.interaction.trackMousemove();
  visflow.interaction.interaction();
  visflow.interaction.contextMenuClickOff();

  this.shifted = false;
  this.ctrled = false;

  this.visualizationBlocking = true;

  // overlapping contextmenued items may show menu together, thus need a lock
  this.contextmenuLock = false;
};

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
 * Enables/disables up the mouse movement tracking.
 * @param {boolean=} opt_enabled
 */
visflow.interaction.trackMousemove = function(opt_enabled) {
  var state = opt_enabled == null ? true : opt_enabled;
  if (state) {
    this.mainContainer.off('mousemove');
  } else {
    this.mainContainer.mousemove(function(event){
      this.mouseX = event.pageX;
      this.mouseY = event.pageY;
    }.bind(this));
  }
};

/**
 * Handles key release event, called after a shift/ctrl terminating event (e.g.
 * node drag). If not called, browser might fail to capture shift/ctrl release
 * and the two keys would be considered pressed forever.
 */
visflow.interaction.keyReleased = function(key) {
  if (!(key instanceof Array)) {
    key = [key];
  }
  key.map(function(key){
    if (key == 'shift') {
      this.shifted = false;
      this.mainContainer.css('cursor', '');
    }
    else if (key == 'ctrl') {
      this.ctrled = false;
      this.mainContainer.css('cursor', '');
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
  var manager = this;
  this.mainContainer
    .mousedown(function(event, ui) {
      if ($(event.target).is('#main')) {
        manager.mousedownHandler({
          type: 'background',
          event: event
        });
      }
    })
    .mousemove(function(event, ui) {
      manager.mousemoveHandler({
        type: 'background',
        event: event
      });
    })
    .mouseup(function(event, ui) {
      manager.mouseupHandler({
        type: 'background',
        event: event
      });
    });

  // track keyboard: shift key
  $(document).keydown(function(event) {
    var code = event.keyCode, index;
    // avoid interfering with input and editable
    if ($(event.target).is('input, .node-label')) {
      return true;
    }

    if ((index = [38, 40, 37, 39].indexOf(code)) != -1){
      // move up/down/left/right
      var shift = [[0, -1], [0, 1], [-1, 0], [1, 0]],
          delta = 50;
      visflow.flow.moveNodes(shift[index][0] * delta, shift[index][1] * delta,
        visflow.flow.nodes);
    }
    else if (code == visflow.interaction.keyCodes.SHIFT) {
      manager.shifted = true;
      manager.mainContainer.css('cursor', 'crosshair');
    } else if (code == visflow.interaction.keyCodes.CTRL) {
      manager.ctrled = true;
      manager.visualizationBlocking = false;
    } else if (code == visflow.interaction.keyCodes.ESC) {   // esc
      manager.escHandler();
    } else {
      var c = String.fromCharCode(code);
      var key = c;
      if (manager.shifted)
        key = 'shift+' + key;
      if (manager.ctrled)
        key = 'ctrl+' + key;

      if (key == 'A') {
        event.pageX = manager.mouseX;
        event.pageY = manager.mouseY;
        visflow.popupPanel.show(event, true); // compact mode
      }
      else if (key == 'shift+A') {
        event.pageX = manager.mouseX;
        event.pageY = manager.mouseY;
        visflow.popupPanel.show(event);
      }
      else if (key == 'shift+V') {
        visflow.flow.toggleVisMode();
      }
      else if (visflow.viewManager.getPopupPanelName() == 'add') {
        // further filtering popup entries
        visflow.viewManager.filterAddPanel(key);
      }
      else if (key == 'M'){
        visflow.viewManager.toggleMenuPanel();
      }
      else {
        // not global interaction event, pass to dataflow
        visflow.flow.keyAction(key, event);
      }
    }
  });

  $(document).keyup(function(event) {
    if (event.keyCode == visflow.interaction.keyCodes.SHIFT) {
      manager.keyReleased('shift');
    } else if (event.keyCode == visflow.interaction.keyCodes.CTRL) {
      manager.keyReleased('ctrl');
    }
  });

  $(document).mousewheel(function(event) {
    // TODO : zoom in view ?
  });
};

/**
 * Prepares canvas contextMenu for '#main'.
 * @private
 */
visflow.interaction.mainContextMenu_ = function() {
  visflow.interaction.contextMenu = new visflow.ContextMenu({
    container: visflow.interaction.mainContainer,
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

  if (this.mouseMode != 'none')
    return true;

  // block mousedown for iris
  if ($(event.target).is('.iris-picker, .iris-square-inner, '
    + '.iris-square-handle, .ui-slider-handle')) {
    type = 'iris';
    return true;
  }

  if (type == 'background') {
    if (!this.ctrled) {
      this.mouseMode = 'pan';
      this.mainContainer.css('cursor', 'move');
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
      this.mainContainer.css('cursor', '');
    } else if (this.mouseMode == 'selectbox') {
      this.jqselectbox.hide();
      if (this.ctrled) {  // not panning, then selecting
        if (!this.shifted)
          visflow.flow.clearNodeSelection();
        visflow.flow.addHoveredToSelection();

        // also hide colorpickers
        visflow.viewManager.hideColorpickers();
      }
    }
  } else if (type == 'node') {
    if (!this.mouseMoved) {
      if (!this.shifted)
        visflow.flow.clearNodeSelection();
      visflow.flow.addNodeSelection(params.node);
    }
  }

  // forcefully end all interactions
  // to prevent inconsistent interaction states resulting from an uncaptured event
  this.keyReleased(['shift', 'ctrl']);
  visflow.viewManager.clearEdgeHover();
  visflow.popupPanel.close();

  this.mouseMode = 'none';
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
    var x = jqtarget.offset().left + jqtarget.outerWidth() / 2,
        y = jqtarget.offset().top + jqtarget.outerHeight() / 2;
    //console.log(jqtarget,x,y, jqtarget.outerWidth());
    this.dragstartPos = [x, y];
    this.dropPossible = true;
  }
  else if (type == 'node') {
    this.mouseMode = 'node';
    this.mainContainer.css('cursor', 'move');

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

  if (this.mouseMode != type)
    return;

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
  var type = params.type,
      event = params.event;
  this.dragstopPara = params;
  this.dragstopPos = [params.event.pageX, params.event.pageY];
  if (type == 'port') {
    $('#edge-drawing')
      .css('visibility', 'hidden');
  }
  else if (type == 'node'){
    this.mainContainer.css('cursor', '');
  }
  this.mouseMode = 'none';
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
    visflow.viewManager.hideColorpickers();
    $('input').blur();
    this.contextmenuLock = false;
  }
};

/**
 * Handles ESC key press.
 */
visflow.interaction.escHandler = function() {
  visflow.flow.clearNodeSelection();
  visflow.viewManager.hideColorpickers();
  visflow.popupPanel.close();
  visflow.dialog.close();
};

/*
getDragstartPara: function() {
  return this.dragstartPara;
},
getDragstopPara: function() {
  return this.dragstopPara;
}
*/