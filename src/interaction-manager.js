/**
 * @fileoverview Interaction manager tracking mouse actions.
 */

'use strict';

/** @const */
visflow.interactionManager = {};

/**
 * Initializes the interaction manager.
 */
visflow.interactionManager.init = function() {
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

  this.jqMain = $('#main');
  this.selectbox = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0
  };
  visflow.interactionManager.prepareInteraction();

  this.shifted = false;
  this.ctrled = false;

  this.visualizationBlocking = true;

  // overlapping contextmenued items may show menu together, thus need a lock
  this.contextmenuLock = false;
};

/**
 * Enables/disables up the mouse movement tracking.
 * @param {boolean} disabled
 */
visflow.interactionManager.trackMousemove = function(disabled) {
  var manager = this;
  if (disabled) {
    this.jqMain.off('mousemove');
  } else {
    this.jqMain.mousemove(function(event, ui){
      manager.currentMouseX = event.pageX;
      manager.currentMouseY = event.pageY;
    });
  }
};

/**
 * Handles key release event, called after a shift/ctrl terminating event (e.g.
 * node drag). If not called, browser might fail to capture shift/ctrl release
 * and the two keys would be considered pressed forever.
 */
visflow.interactionManager.keyReleased = function(key) {
  if (!(key instanceof Array)) {
    key = [key];
  }
  key.map(function(key){
    if (key == 'shift') {
      this.shifted = false;
      this.jqMain.css('cursor', '');
    }
    else if (key == 'ctrl') {
      this.ctrled = false;
      this.jqMain.css('cursor', '');
      this.visualizationBlocking = true;
    }
  }, this);
};

/**
 * Prepares global interaction handlers.
 */
visflow.interactionManager.prepareInteraction = function() {
  this.trackMousemove();

  this.jqselectbox = $('#dataflow-selectbox');
  this.jqselectbox.hide();
  var manager = this;
  this.jqMain
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
    if ($(event.target).is('input, .dataflow-node-label'))
      return true;

    if ((index = [38, 40, 37, 39].indexOf(code)) != -1){
      // move up/down/left/right
      var shift = [[0, -1], [0, 1], [-1, 0], [1, 0]],
          delta = 50;
      visflow.flowManager.moveNodes(shift[index][0] * delta, shift[index][1] * delta,
        visflow.flowManager.nodes);
    }
    else if (code == 16) {
      manager.shifted = true;
      manager.jqdataflow.css('cursor', 'crosshair');
    } else if (code == 17) {
      manager.ctrled = true;
      manager.visualizationBlocking = false;
    } else if (code == 27) {   // esc
      manager.escHandler();
    } else {
      var c = String.fromCharCode(code);
      var key = c;
      if (manager.shifted)
        key = 'shift+' + key;
      if (manager.ctrled)
        key = 'ctrl+' + key;

      if (key == 'A') {
        event.pageX = manager.currentMouseX;
        event.pageY = manager.currentMouseY;
        visflow.viewManager.showAddPanel(event, true); // compact mode
      }
      else if (key == 'shift+A') {
        event.pageX = manager.currentMouseX;
        event.pageY = manager.currentMouseY;
        visflow.viewManager.showAddPanel(event);
      }
      else if (key == 'shift+V') {
        visflow.flowManager.toggleVisMode();
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
        visflow.flowManager.keyAction(key, event);
      }
    }
  });

  $(document).keyup(function(event) {
    if (event.keyCode == 16) {
      manager.keyReleased('shift');
    } else if (event.keyCode == 17) {
      manager.keyReleased('ctrl');
    }
  });

  $(document).mousewheel(function(event) {
    // TODO : zoom in view ?
  });

  this.jqMain.contextmenu({
    addClass: 'ui-contextmenu',
    menu: [
        {title: 'Add Node', cmd: 'add', uiIcon: 'ui-icon-plus'}
      ],
    select: function(event, ui) {
      if (ui.cmd == 'add') {
        visflow.viewManager.showAddPanel(event);
      }
    },
    beforeOpen: function(event, ui) {
      if (visflow.interactionManager.contextmenuLock)
        return false;
      visflow.interactionManager.contextmenuLock = true;
    },
    close: function(event, ui) {
      visflow.interactionManager.contextmenuLock = false;
    }
  });
};

/**
 * Handles mouse down event.
 * @param {!Object} params
 */
visflow.interactionManager.mousedownHandler = function(params) {
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
      this.jqMain.css('cursor', 'move');
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
visflow.interactionManager.mousemoveHandler = function(params) {
  var type = params.type,
      event = params.event;
  //if (this.mouseMode != type)
  //  return;

  if (type == 'background') {
    if (this.mouseMode == 'pan') {
      var dx = event.pageX - this.mouselastPos[0],
          dy = event.pageY - this.mouselastPos[1];
      visflow.flowManager.moveNodes(dx, dy, visflow.flowManager.nodes);
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
      var hovered = visflow.flowManager.getNodesInSelectbox(box);
      visflow.flowManager.clearNodeHover();
      visflow.flowManager.addNodeHover(hovered);
    }
  }
  this.mouselastPos = [event.pageX, event.pageY];
};

/**
 * Handles mouse up event.
 * @param {!Object} params
 */
visflow.interactionManager.mouseupHandler = function(params) {
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
      this.jqMain.css('cursor', '');
    } else if (this.mouseMode == 'selectbox') {
      this.jqselectbox.hide();
      if (this.ctrled) {  // not panning, then selecting
        if (!this.shifted)
          visflow.flowManager.clearNodeSelection();
        visflow.flowManager.addHoveredToSelection();

        // also hide colorpickers
        visflow.viewManager.hideColorpickers();
      }
    }
  } else if (type == 'node') {
    if (!this.mouseMoved) {
      if (!this.shifted)
        visflow.flowManager.clearNodeSelection();
      visflow.flowManager.addNodeSelection(params.node);
    }
  }

  // forcefully end all interactions
  // to prevent inconsistent interaction states resulting from an uncaptured event
  this.keyReleased(['shift', 'ctrl']);
  visflow.viewManager.clearEdgeHover();
  visflow.viewManager.closePopupPanel();

  this.mouseMode = 'none';
};

/**
 * Handles drag start event.
 * @param params
 */
visflow.interactionManager.dragstartHandler = function(params) {
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
    this.jqMain.css('cursor', 'move');

    if (visflow.flowManager.isNodeSelected(params.node)) {
      // already selected, then drag all selection
    } else {
      // make a new exclusive selection
      visflow.flowManager.clearNodeSelection();
      visflow.flowManager.addNodeSelection(params.node);
    }
  }
  this.draglastPos = [event.pageX, event.pageY];
};

/**
 * Handles dragging movement event.
 * @param params
 */
visflow.interactionManager.dragmoveHandler = function(params) {
  var type = params.type,
      event = params.event;
  this.dragstopPos = [params.event.pageX, params.event.pageY];

  if (this.mouseMode != type)
    return;

  if (type == 'port') {
    var dx = this.dragstopPos[0] - this.dragstartPos[0],
        dy = this.dragstopPos[1] - this.dragstartPos[1];

    var jqsegment = $('#dataflow-edge-drawing > .dataflow-edge-segment'),
        jqarrow = $('#dataflow-edge-drawing > .dataflow-edge-arrow');
    var hseg = 3,
        harrow = 9;

    var pos = para.port.isInPort ? this.dragstopPos : this.dragstartPos,
        rpos = !para.port.isInPort ? this.dragstopPos : this.dragstartPos;
    if (para.port.isInPort) {
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

    $('#dataflow-edge-drawing')
      .css('visibility', 'visible');
  }
  else if (type == 'node') {
    var dx = event.pageX - this.draglastPos[0],
        dy = event.pageY - this.draglastPos[1];

    // the dragged node is moving together (with more offset)
    // the more offset will be reset immediately by jquery draggable however
    visflow.flowManager.moveNodes(dx, dy, visflow.flowManager.nodesSelected);  // delta & nodes
    this.draglastPos = [event.pageX, event.pageY];
  }
};

/**
 * Handles drag stop event.
 * @param params
 */
visflow.interactionManager.dragstopHandler = function(params) {
  var type = params.type,
      event = params.event;
  this.dragstopPara = params;
  this.dragstopPos = [params.event.pageX, params.event.pageY];
  if (type == 'port') {
    $('#dataflow-edge-drawing')
      .css('visibility', 'hidden');
  }
  else if (type == 'node'){
    this.jqMain.css('cursor', '');
  }
  this.mouseMode = 'none';
};

/**
 * Handles drop event.
 * @param params
 */
visflow.interactionManager.dropHandler = function(params) {
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
      visflow.flowManager.createEdge(port1, port2);
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
        visflow.flowManager.createEdge(port1, port2);
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
visflow.interactionManager.clickHandler = function(params) {
  var type = params.type,
      event = params.event;
  if (type == 'empty') {
    visflow.flowManager.clearNodeSelection();
    visflow.viewManager.hideColorpickers();
    $('input').blur();
    this.contextmenuLock = false;
  }
};

/**
 * Handles ESC key press.
 */
visflow.interactionManager.escHandler = function() {
  visflow.flowManager.clearNodeSelection();
  visflow.viewManager.hideColorpickers();
  visflow.viewManager.closePopupPanel();
};

/*
getDragstartPara: function() {
  return this.dragstartPara;
},
getDragstopPara: function() {
  return this.dragstopPara;
}
*/