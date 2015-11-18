/**
 * @fileoverview visflow node module.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 */
visflow.Node = function(params) {
  if (params == null) {
    visflow.error('null params');
    return;
  }
  this.hashtag = 'h-' + visflow.utils.randomString(8); // for serialization

  this.nodeId = params.nodeId;
  this.type = params.type;

  this.portHeight = 20;
  this.portGap = 4;

  // no ports by default
  this.inPorts = [];
  this.outPorts = [];
  this.ports = {};

  // default not showing icon
  this.detailsOn = true;

  // default not showing label
  this.labelOn = false;
  this.label = 'node label';

  this.visModeOn = false;

  this.optionsOffset = null;

  this.css = {};
  this.visCss = {};

  this.jqview = params.jqview;
};

/** @const {string} */
visflow.Node.prototype.SHAPE_NAME = 'none';

/**
 * Icon class to set when node details are hidden.
 * @const {string}
 */
visflow.Node.prototype.ICON_CLASS = '';

/** @const {!Object} */
visflow.Node.prototype.contextMenuDisabled = {};

/**
 * Serializes the node to be storable JSON.
 * @return {!Object}
 */
visflow.Node.prototype.serialize = function() {
  this.label = this.jqview.find('.node-label').text();
  this.saveCss();
  var result = {
    nodeId: this.nodeId,
    hashtag: this.hashtag,
    type: this.type,
    detailsOn: this.detailsOn,
    optionsOn: this.optionsOn,
    optionsOffset: this.optionsOffset,
    labelOn: this.labelOn,
    label: this.label,
    css: this.css,
    visModeOn: this.visModeOn,
    visCss: this.visCss
  };
  return result;
};

/**
 * Deserializes JSON to create a node.
 * @param {!Object} save
 */
visflow.Node.prototype.deserialize = function(save) {
  this.detailsOn = save.detailsOn;
  if (this.detailsOn == null) {
    this.detailsOn = true;
    visflow.error('detailsOn not saved');
  }
  this.optionsOffset = save.optionsOffset;
  this.optionsOn = save.optionsOn;
  this.labelOn = save.labelOn;
  this.label = save.label;

  this.css = save.css;

  this.visModeOn = save.visModeOn;
  this.visCss = save.visCss;
  if (this.visModeOn == null){
    visflow.error('visModeOn not saved');
    this.visModeOn = false;
    this.visCss = {};
  }

  if (this.labelOn == null) {
    visflow.error('labelOn not saved');
    this.labelOn = false;
  }
  if (this.label == null) {
    visflow.error('label not saved');
    this.label = 'node label';
  }
};

/**
 * Prepares all necessary data structures for references.
 * This is called after node initialization.
 */
visflow.Node.prototype.prepare = function() {
  this.preparePorts();
};

/**
 * Prepares the ports of the node.
 */
visflow.Node.prototype.preparePorts = function() {
  var allports = this.inPorts.concat(this.outPorts);
  for (var i in allports) {
    this.ports[allports[i].id] = allports[i];
    allports[i].pack.changed = false; // initialize change to false after creation
  }
};

/**
 * Sets the jquery view container.
 * @param {!jQuery} jqview
 */
visflow.Node.prototype.setJqview = function(jqview) {
  this.jqview = jqview;
  jqview.addClass(this.hashtag);
};

/**
 * Shows the node.
 * This removes everything created, including those from inheriting classes.
 * Inheriting classes shall not remove again.
 */
visflow.Node.prototype.show = function() {
  this.jqview.children()
    .not('.ui-resizable-handle')
    .remove();

  if (!this.visModeOn && visflow.flow.visModeOn) {
    // do not show if hidden in vis mode
    return;
  }
  this.jqview.show();
  this.showLabel();

  if (this.detailsOn) {
    this.jqview
      .addClass('node node-shape');

    if (this.SHAPE_NAME != 'none') {
      this.jqview
        .removeClass('node-shape')
        .addClass('node-shape-' + this.SHAPE_NAME);
    }
    this.prepareNodeInteraction();
    this.prepareContextmenu();
    this.showDetails();
  } else {
    this.jqview
      .removeClass('node-shape-' + this.SHAPE_NAME)
      .addClass('node-shape')
      .css({
        width: '',
        height: ''
      })
      .resizable('disable'); // remove constraints set in details mode
    this.showIcon();
  }

  if (!visflow.flow.visModeOn) {
    // not show edges with vis mode on
    this.showPorts();
    this.updatePorts(); // update edges
  }
  this.options();
};

/**
 * Shows the node icon.
 */
visflow.Node.prototype.showIcon = function() {
  this.jqicon = $('<div></div>')
    .addClass(this.ICON_CLASS)
    .appendTo(this.jqview);
};

/**
 * Shows the node label.
 */
visflow.Node.prototype.showLabel = function() {
  var node = this;
  this.jqview.find('.node-label').remove();
  if (this.labelOn) {
    $('<div></div>')
      .attr('contenteditable', true)
      .addClass('node-label')
      .text(this.label)
      .prependTo(this.jqview)
      .mousedown(function (event) {
        $(this).attr('contenteditable', true);  // re-enable when clicked
      })
      .blur(function (event) {
        node.label = $(this).text();  // may contain html tag, ignore
        $(this).attr('contenteditable', false); // disable, otherwise requires 2 clicks
      });
  }
};

/**
 * Shows/hides options.
 * To handle options, implement showOptions().
 */
visflow.Node.prototype.options = function() {
  var node = this;
  if (this.optionsOn == true) {
    if (this.jqoptions) { // already shown, clear
      this.jqoptions.remove();
    }
    this.jqoptions = $('<div></div>')
      .addClass('options')
      .appendTo(this.jqview)
      .draggable({
        stop: function(event) {
          var offset = $(event.target).position();  // relative position
          node.optionsOffset = offset;
        }
      });
    if (this.optionsOffset != null) {
      this.jqoptions.css(this.optionsOffset);
    }
    this.showOptions();
  } else {
    if (this.jqoptions) {
      this.jqoptions.remove();
      this.jqoptions = null;
    }
  }
};

/**
 * Prepares the node's interactions.
 */
visflow.Node.prototype.prepareNodeInteraction = function() {
  if (this.nodeInteractionOn) {
    // prevent making interaction twice
    return;
  }

  this.nodeInteractionOn = true;

  var node = this,
      jqview = this.jqview;

  this.jqview
    .mouseenter(function() {
      jqview.addClass('node-hover');
    })
    .mouseleave(function() {
      jqview.removeClass('node-hover');
    })
    .mousedown(function(event, ui) {
      if (event.which === 1) // left click
        visflow.flow.activateNode(node.nodeId);
      else if (event.which === 3)
        $('.ui-contextmenu')
          .css('z-index', 1000); // over other things
      visflow.interactionManager.mousedownHandler({
        type: 'node',
        event: event,
        node: node
      });
    })
    .mouseup(function(event, ui) {
      visflow.interactionManager.mouseupHandler({
        type: 'node',
        event: event,
        node: node
      });
    })
    .resizable({
      handles: 'all',
      resize: function(event, ui) {
        node.resize(ui.size);
      },
      stop: function(event, ui) {
        node.resizestop(ui.size);
      }
    })
    .draggable({
      cancel: 'input, .node-label',
      //containment: '#dataflow',
      start: function(event, ui) {
        visflow.interactionManager.dragstartHandler({
          type: 'node',
          event: event,
          node: node
        });
      },
      drag: function(event, ui) {
        visflow.interactionManager.dragmoveHandler({
          type: 'node',
          event: event,
          node: node
        });
        node.updateEdges();
      },
      stop: function(event, ui) {
        visflow.interactionManager.dragstopHandler({
          type: 'node',
          event: event
        });
      }
   })
   .droppable({
      drop: function(event, ui) {
        visflow.interactionManager.dropHandler({
          type: 'node',
          event: event,
          node: node
        });
      }
   });

  // remove resizable handler icon at se
  this.jqview.find('.ui-icon-gripsmall-diagonal-se')
    .removeClass('ui-icon ui-icon-gripsmall-diagonal-se');
  this.jqview.resizable('disable');
};

/**
 * Prepares the contextMenu of the node.
 */
visflow.Node.prototype.prepareContextmenu = function() {
  var node = this,
      jqview = this.jqview;

  // right-click menu
  this.jqview.contextmenu({
    delegate: this.jqview,
    addClass: 'ui-contextmenu',
    menu: [
        {title: 'Toggle Details', cmd: 'details', uiIcon: 'ui-icon-document'},
        {title: 'Toggle Options', cmd: 'options', uiIcon: 'ui-icon-note'},
        {title: 'Toggle Label', cmd: 'label'},
        {title: 'Visualization Mode', cmd: 'vismode'},
        {title: 'Delete', cmd: 'delete', uiIcon: 'ui-icon-close'},
      ],
    select: function(event, ui) {
      return node.contextmenuSelect(event, ui);
    },
    beforeOpen: function(event, ui) {
      return node.contextmenuBeforeOpen(event, ui);
    },
    close: function(event, ui) {
      return node.contextmenuClose(event, ui);
    }
  });
  // disable some of the entries based on child class specification
  // in this.contextmenuDisabled
  for (var entry in this.contextmenuDisabled) {
    this.jqview.contextmenu('showEntry', entry, false);
  }
};

/**
 * Handles contextMenu selection.
 * @param {!jQuery.event} event
 * @param {!jQuery.ui} ui
 */
visflow.Node.prototype.contextmenuSelect = function(event, ui) {
  switch(ui.cmd) {
    case 'details':
      this.toggleDetails();
      break;
    case 'options':
      this.toggleOptions();
      break;
    case 'label':
      this.toggleLabel();
      break;
    case 'vismode':
      this.toggleVisMode();
      break;
    case 'delete':
      visflow.flow.deleteNode(this);
      break;
  }
};

/**
 * Runs before contextMenu is about to open.
 * @param {!jQuery.event} event
 * @param {!jQuery.ui} ui
 */
visflow.Node.prototype.contextmenuBeforeOpen = function(event, ui) {
  if (!this.visModeOn) {
    this.jqview.contextmenu('setEntry', 'vismode',
      {title: 'Visualization Mode'});
  } else {
    this.jqview.contextmenu('setEntry', 'vismode',
      {title: 'Visualization Mode', uiIcon: 'ui-icon-check'});
  }
  if (visflow.interactionManager.contextmenuLock) {
    return false;
  }
  visflow.interactionManager.contextmenuLock = true;
};

/**
 * Closes the contextMenu of the node.
 */
visflow.Node.prototype.contextmenuClose = function(event, ui) {
  visflow.interactionManager.contextmenuLock = false;
};

/**
 * Generates a dimension list of the node to be selected.
 * @param {Array<string>} ignoreTypes
 * @returns {!Array}
 */
visflow.Node.prototype.prepareDimensionList = function(ignoreTypes) {
  if (ignoreTypes == null) {
    ignoreTypes = [];
  }

  var inpack = this.ports['in'].pack;
  if (inpack.isEmptyData())
    return [];
  var dims = inpack.data.dimensions,
      dimTypes = inpack.data.dimensionTypes;
  var list = [];
  for (var i in dims) {
    if (ignoreTypes.indexOf(dimTypes[i]) != -1)
      continue;
    list.push({
      value: i,
      text: dims[i]
    });
  }
  return list;
};

/**
 * Re-renders the edges after node is moved.
 */
visflow.Node.prototype.updateEdges = function() {
  for (var key in this.ports) {
    var port = this.ports[key];
    for (var i in port.connections) {
      var edge = port.connections[i];
      edge.update();
    }
  }
};

/**
 * Shows all the ports.
 */
visflow.Node.prototype.showPorts = function() {
  this.jqview.find('.port').remove();

  var width = this.jqview.width(),
      height = this.jqview.innerHeight();

  var portStep = this.portHeight + this.portGap;
  var inTopBase = (height - this.inPorts.length * portStep + this.portGap) / 2;
  for (var i in this.inPorts) {
    var port = this.inPorts[i];
    var jqview = $('<div></div>')
      .css('top', inTopBase + i * portStep)
      .appendTo(this.jqview);
    port.setJqview(jqview);
  }
  var outTopBase = (height - this.outPorts.length * portStep + this.portGap) / 2;
  for (var i in this.outPorts) {
    var port = this.outPorts[i];
    var jqview = $('<div></div>')
      .css('top', outTopBase + i * portStep)
      .appendTo(this.jqview);
    port.setJqview(jqview);
  }
};

/**
 * Updates port rendering based on new node sizes.
 */
visflow.Node.prototype.updatePorts = function() {
  var width = this.jqview.width();
  var height = this.jqview.innerHeight();
  var portStep = this.portHeight + this.portGap;
  var inTopBase = (height - this.inPorts.length * portStep +
      this.portGap) / 2;
  for (var i in this.inPorts) {
    var port = this.inPorts[i];
    port.jqview.css('top', inTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
  var outTopBase = (height - this.outPorts.length * portStep +
      this.portGap) / 2;
  for (var i in this.outPorts) {
    var port = this.outPorts[i];
    port.jqview.css('top', outTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
};

/**
 * Removes the port.
 */
visflow.Node.prototype.remove = function() {
  $(this.jqview).children().remove();
  visflow.viewManager.removeNodeView(this.jqview);
};

/**
 * Hides the port.
 */
visflow.Node.prototype.hide = function() {
  $(this.jqview).hide();
};

/**
 * Finds the first node port that can be connected to the given 'port'.
 * @param {!visflow.Port} port Port to be connected to.
 * @return {visflow.Port} 'null' if no port is connectable.
 */
visflow.Node.prototype.firstConnectable = function(port) {
  var ports = port.isInPort ? this.outPorts : this.inPorts;
  for (var i in ports) {
    var port2 = ports[i];
    if (port2.connectable(port) == 0){
      return port2;
    }
  }
  return null;
};

/**
 * Checks if any input port data has been changed.
 * @return {boolean}
 */
visflow.Node.prototype.inPortsChanged = function() {
  for (var i in this.inPorts) {
    if (this.inPorts[i].isSingle) {
      if (this.inPorts[i].pack.changed) {
        return true;
      }
    } else {  // in-multiple
      for (var j in this.inPorts[i].packs) {
        if (this.inPorts[i].packs[j].changed) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Updates the node.
 */
visflow.Node.prototype.update = function() {
  if (!this.inPortsChanged()) {
    return; // everything not changed, do not process
  }

  this.process();
  this.show();

  /*
  // TODO(bowen): Double check here, process shall already handles it
  for (var i in this.outPorts) {
    this.outPorts[i].pack.changed = true; // mark changes
  }
  */
};

/**
 * Processes input data and generates output.
 * This is to be extended in inheriting classes.
 */
visflow.Node.prototype.process = function() {
  // Warning: You cannot call propagate in process, otherwise flowManager will
  // endlessly call process().
};

/**
 * Saves the current css specification into 'this.css' or 'this.visCss'.
 */
visflow.Node.prototype.saveCss = function() {
  var css = {
    left: this.jqview.position().left,
    top: this.jqview.position().top,
    width: this.jqview.width(),
    height: this.jqview.height()
  };
  if (!visflow.flow.visModeOn) {
    _(this.css).extend(css);
  } else {
    _(this.visCss).extend(css);
  }
};

/**
 * Applies css specification.
 */
visflow.Node.prototype.loadCss = function() {
  if (!visflow.flow.visModeOn) {
    this.jqview.css(this.css);
  } else {
    this.jqview.css(this.visCss);
  }
};

/**
 * Handles key events.
 * @param {string} key
 * @param {!jQuery.event} event
 */
visflow.Node.prototype.keyAction = function(key, event) {
  if ($(event.target).is('input')) {
    // avoid interfering with user typing input
    return;
  }
  switch(key) {
    case '.':
    case 'ctrl+X':
      visflow.flow.deleteNode(this);
      break;
    case 'D':
      this.toggleDetails();
      break;
    case 'T':
      this.toggleOptions();
      break;
    case 'L':
      this.toggleLabel();
      break;
    case 'V':
      this.toggleVisMode();
      break;
  }
};

/**
 * Toggles node visualization mode.
 */
visflow.Node.prototype.toggleVisMode = function() {
  this.visModeOn = !this.visModeOn;
};

/**
 * Toggles node details.
 */
visflow.Node.prototype.toggleDetails = function() {
  if (this.contextmenuDisabled['details'] != null) {
    return;
  }
  this.detailsOn = !this.detailsOn;
  this.show();
  this.updatePorts();
};

/**
 * Toggles node option.
 */
visflow.Node.prototype.toggleOptions = function() {
  if (this.contextmenuDisabled['options'] != null) {
    return;
  }
  this.optionsOn = !this.optionsOn;
  this.options();
};

/**
 * Toggles node label.
 */
visflow.Node.prototype.toggleLabel = function() {
  if (this.contextmenuDisabled['label'] != null) {
    return;
  }
  this.labelOn = !this.labelOn;
  this.showLabel();
};

/**
 * Processes and propagates changes.
 */
visflow.Node.prototype.pushflow = function() {
  this.process();
  visflow.flow.propagate(this); // push property changes to downflow
};

/**
 * Handles node resize.
 * @param size
 */
visflow.Node.prototype.resize = function(size) {
  if (visflow.flow.visModeOn == false) {
    this.viewWidth = size.width;
    this.viewHeight = size.height;
    _(this.css).extend({
      width: size.width,
      height: size.height
    });
    this.updatePorts();
  } else {
    _(this.visCss).extend({
      width: size.width,
      height: size.height
    });
  }
};

/**
 * Handles resize stop event.
 */
visflow.Node.prototype.resizestop = function(size) {
  this.resize(size);
};


/**
 * Displays node options.
 */
visflow.Node.prototype.showOptions = function() {};

/**
 * Displays node details.
 */
visflow.Node.prototype.showDetails = function() {};


