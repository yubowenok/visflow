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

  /**
   * Hash tag used to serialize the diagram.
   * @param {string}
   */
  this.hashtag = 'h-' + visflow.utils.randomString(8); // for serialization

  /**
   * Node ID.
   * @param {string}
   */
  this.id = params.id;
  /**
   * Node type.
   * @param {string}
   */
  this.type = params.type;

  /**
   * Input ports.
   * @protected {!Array<!visflow.Port>}
   */
  this.inPorts = [];
  /**
   * Output ports.
   * @protected {!Array<!visflow.Port>}
   */
  this.outPorts = [];
  /**
   * Ports collection. Key is port id.
   * @protected {!Object<!visflow.Port>}
   */
  this.ports = {};

  /**
   * Node options.
   * @protected {!Object<*>}
   */
  this.options = {
    // Whether to node icon instead of node details.
    minimized: false,
    // Whether to show node label.
    label: true,
    // Whether the node is visible in visMode.
    visMode: false
  };

  /**
   * Node label.
   * @protected {string}
   */
  this.label = 'node label';

  /**
   * Position offset of node options panel.
   * @protected {null}
   */
  this.optionsOffset = null;

  /**
   * CSS state.
   * @protected {!Object}
   */
  this.css = {};
  /**
   * CSS state in visMode.
   * @protected {!Object}
   */
  this.visCss = {};

  /**
   * Node container.
   * @protected {!jQuery}
   */
  this.container = params.container;

  /**
   * Wrapper for the node content.
   * @protected {jQuery}
   */
  this.content;

  /**
   * Node icon.
   * @protected {jQuery}
   */
  this.icon;

  /**
   * Mouse interaction mode.
   * @protected {string}
   */
  this.mouseMode = '';

  /**
   * Context menu.
   * @protected {visflow.ContextMenu}
   */
  this.contextMenu;

  this.container.load(this.TEMPLATE, function() {
    this.container
      .addClass('node')
      .addClass(this.NODE_CLASS)
      .addClass(this.SHAPE_CLASS)
      .addClass(this.hashtag);

    this.content = this.container.children('.content');

    this.icon = this.container.children('.icon');

    // Call init to prepare node elements.
    this.init();

    // Set up interaction after initialization.
    // This requires node elements to be created beforehand.
    this.interaction();

    // For callback.
    $(this).trigger('visflow.ready');
  }.bind(this));
};

/**
 * Node template file.
 * @protected {string}
 */
visflow.Node.prototype.TEMPLATE = './src/node/node.html';

// Minimum size of resizable. Default is no minimum.
/** @protected @const {number} */
visflow.Node.prototype.MIN_WIDTH = 0;
/** @protected @const {number} */
visflow.Node.prototype.MIN_HEIGHT = 0;

/**
 * Class that defines the node type.
 * @protected @const {string}
 */
visflow.Node.prototype.NODE_CLASS = '';
/**
 * Class added when node is minimized.
 * @protected @const {string}
 */
visflow.Node.prototype.MINIMIZED_CLASS = '';
/**
 * Class that defines the node shape. This is only effective when the node
 * details are shown.
 * @protected @const {string}
 */
visflow.Node.prototype.SHAPE_CLASS = 'shape-medium';

/**
 * Contextmenu entries.
 * @protected @const {!Array<{id: string, text: string, icon: string}>}
 */
visflow.Node.prototype.CONTEXTMENU_ITEMS = [
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-minus'},
  {id: 'visMode', text: 'Visualization Mode', icon: 'glyphicon glyphicon-picture'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];

/** @const {number} */
visflow.Node.prototype.portHeight = 20;
/** @const {number} */
visflow.Node.prototype.portGap = 4;

/**
 * Initializes the node. This shall be called after node elements are loaded
 * from template.
 */
visflow.Node.prototype.init = function() {
  this.listInOutPorts_();
  this.initContextMenu();
};

/**
 * Serializes the node to be storable JSON.
 * @return {!Object}
 */
visflow.Node.prototype.serialize = function() {
  this.label = this.container.find('.node-label').text();
  this.saveCss();
  var result = {
    nodeId: this.nodeId,
    hashtag: this.hashtag,
    type: this.type,
    label: this.label,
    css: this.css,
    visCss: this.visCss,
    options: this.options
  };
  return result;
};

/**
 * Deserializes JSON to create a node.
 * @param {!Object} save
 */
visflow.Node.prototype.deserialize = function(save) {
  this.optionsOffset = save.optionsOffset;
  this.optionsOn = save.optionsOn;

  if (save.options == null) {
    visflow.warning('old options data');
    save.options = {
      label: save.labelOn,
      icon: !save.detailsOn,
      visMode: save.visModeOn
    };
  }
  this.options = {};
  _(this.options).extend(save.options);

  this.label = save.label;
  this.css = save.css;
  this.visCss = save.visCss;

  // Apply saved properties. As node size is saved, we need to explicitly fire
  // a resize event.
  this.container.css(this.css);
  this.resize();

  if (this.options.visMode == null){
    visflow.error('visModeOn not saved');
    this.visModeOn = false;
    this.visCss = {};
  }
  if (this.options.label == null) {
    this.options.label = true;
  }
  if (this.label == null) {
    visflow.error('label not saved');
    this.label = 'node label';
  }
};

/**
 * Creates a list for input, output ports, respectively.
 * @private
 */
visflow.Node.prototype.listInOutPorts_ = function() {
  $.each(this.ports, function(id, port) {
    if (port.isInPort) {
      this.inPorts.push(port);
    } else {
      this.outPorts.push(port);
    }
  }.bind(this));
};

/**
 * Displays a message at the center of the node.
 * @param {string} msg
 */
visflow.Node.prototype.showMessage = function(msg) {
  var popup = this.container.children('.popup');
  popup.children('.text').text(msg);
  popup.show();
};

/**
 * Hides the node message.
 */
visflow.Node.prototype.hideMessage = function() {
  this.container.children('.popup').hide();
};

/**
 * Shows the node.
 * This removes everything created, including those from inheriting classes.
 * Inheriting classes shall not remove again.
 */
visflow.Node.prototype.show = function() {
  //this.content.children().remove();

  if (!this.visModeOn && visflow.flow.visModeOn) {
    // do not show if hidden in vis mode
    return;
  }
  this.container.show();
  this.showLabel();

  if (this.options.minimized) {
    this.container
      .removeClass('details')
      .addClass('minimized')
      .addClass(this.MINIMIZED_CLASS)
      .css({
        width: '',
        height: ''
      })
      .resizable('disable'); // remove constraints set in details mode
    this.showIcon();
  } else {
    this.container
      .addClass('details')
      .removeClass('minimized');

    this.showDetails();
  }

  if (!visflow.flow.visModeOn) {
    // not show edges with vis mode on
    this.showPorts();
    this.updatePorts(); // update edges
  }
  this.showPanel();
};

/**
 * Shows the node label.
 */
visflow.Node.prototype.showLabel = function() {
  if (this.options.label) {
    this.container.children('.node-label')
      .text(this.label)
      .show();
  } else {
    this.container.children('.node-label').hide();
  }
};

/**
 * Shows/hides options panel.
visflow.Node.prototype.showPanel = function() {
  var node = this;
  if (this.optionsOn == true) {
    if (this.jqoptions) { // already shown, clear
      this.jqoptions.remove();
    }
    this.jqoptions = $('<div></div>')
      .addClass('options')
      .appendTo(this.container)
      .draggable({
        stop: function(event) {
          var offset = $(event.target).position();  // relative position
          node.optionsOffset = offset;
        }
      });
    if (this.optionsOffset != null) {
      this.jqoptions.css(this.optionsOffset);
    }
  } else {
    if (this.jqoptions) {
      this.jqoptions.remove();
      this.jqoptions = null;
    }
  }
};
 */

/**
 * Focuses the view, brings the view to front.
 */
visflow.Node.prototype.focus = function() {
  $(this.container).css('z-index', visflow.viewManager.topZIndex());
};


/*
  Node mouse event handlers. When overriding these functions, make sure that
  event propagation are handled properly. Otherwise multiple interaction
  might be triggered.
 */
/**
 * Handles node lick event.
 */
visflow.Node.prototype.click = function() {};
/**
 * Handles mousedown event.
 */
visflow.Node.prototype.mousedown = function(event) {
  visflow.interaction.mousedownHandler({
    type: 'node',
    event: event,
    node: this
  });
};
/**
 * Handles mouseup event.
 */
visflow.Node.prototype.mouseup = function(event) {
  visflow.interaction.mouseupHandler({
    type: 'node',
    event: event,
    node: this
  });
};
/**
 * Handles mouseenter event.
 */
visflow.Node.prototype.mouseenter = function(event) {
  this.container.addClass('hover');
};
/**
 * Handles mouseleave event.
 */
visflow.Node.prototype.mouseleave = function(event) {
  this.container.removeClass('hover');
};
/**
 * Handles mousemove event.
 */
visflow.Node.prototype.mousemove = function(event) {
};


/**
 * Prepares the node's interactions.
 */
visflow.Node.prototype.interaction = function() {
  if (this.nodeInteractionOn) {
    // prevent making interaction twice
    return;
  }

  this.nodeInteractionOn = true;

  // Add event handlers that can be inherited.
  this.container
    .click(this.click.bind(this))
    .mousedown(this.mousedown.bind(this))
    .mouseup(this.mouseup.bind(this))
    .mouseenter(this.mouseenter.bind(this))
    .mouseleave(this.mouseleave.bind(this));

  // Add event handlers that are always triggered.
  this.container
    .mousedown(function(event) {
      if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
        this.focus();
        visflow.contextMenu.hide();
      }
    }.bind(this));

  this.container
    .resizable({
      handles: 'all',
      minWidth: this.MIN_WIDTH,
      minHeight: this.MIN_HEIGHT,
      resize: function(event, ui) {
        this.resize(ui.size);
      }.bind(this),
      stop: function(event, ui) {
        this.resizeStop(ui.size);
      }.bind(this)
    })
    .draggable({
      cancel: 'input, button, a, select, .node-label',
      //containment: '#main',
      start: function(event) {
        visflow.interaction.dragstartHandler({
          type: 'node',
          event: event,
          node: this
        });
      }.bind(this),
      drag: function(event) {
        visflow.interaction.dragmoveHandler({
          type: 'node',
          event: event,
          node: this
        });
        this.updateEdges();
      }.bind(this),
      stop: function(event) {
        visflow.interaction.dragstopHandler({
          type: 'node',
          event: event
        });
      }.bind(this)
   })
   .droppable({
      drop: function(event) {
        visflow.interaction.dropHandler({
          type: 'node',
          event: event,
          node: this
        });
      }.bind(this)
   });

  // For unknown reasons, 'resizable: true' has no effect if put in the above
  // resizable({...}) call.
  this.container.resizable('disable');

  this.container.children('.node-label')
    .mousedown(function () {
      // Re-enable the contenteditable on click.
      $(this).attr('contenteditable', true);
    })
    .blur(function () {
      // may contain html tag, ignore
      node.label = $(this).text();
      // Disable the contenteditable. Otherwise by default it requires 2 clicks
      // to blur.
      $(this).attr('contenteditable', false);
    });
};

/**
 * Prepares the contextmenu of the node.
 */
visflow.Node.prototype.initContextMenu = function() {
  this.contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.CONTEXTMENU_ITEMS
  });

  $(this.contextMenu)
    .on('visflow.delete', function() {
    })
    .on('visflow.icon', function() {
    })
    .on('visflow.panel', function() {
    })
    .on('visflow.label', function() {
    })
    .on('visflow.visMode', function() {
    });
};

/**
 * Handles contextmenu selection.
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
  this.container.find('.port').remove();

  var width = this.container.width(),
      height = this.container.innerHeight();

  var portStep = this.portHeight + this.portGap;
  var inTopBase = (height - this.inPorts.length * portStep + this.portGap) / 2;
  this.inPorts.forEach(function(port, index) {
    var container = $('<div></div>')
      .css('top', inTopBase + index * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }, this);
  var outTopBase = (height - this.outPorts.length * portStep + this.portGap) / 2;
  this.outPorts.forEach(function(port, index) {
    var container = $('<div></div>')
      .css('top', outTopBase + index * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }, this);
};

/**
 * Updates port rendering based on new node sizes.
 */
visflow.Node.prototype.updatePorts = function() {
  var width = this.container.width();
  var height = this.container.innerHeight();
  var portStep = this.portHeight + this.portGap;
  var inTopBase = (height - this.inPorts.length * portStep +
      this.portGap) / 2;
  for (var i in this.inPorts) {
    var port = this.inPorts[i];
    port.container.css('top', inTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
  var outTopBase = (height - this.outPorts.length * portStep +
      this.portGap) / 2;
  for (var i in this.outPorts) {
    var port = this.outPorts[i];
    port.container.css('top', outTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
};

/**
 * Removes the port.
 */
visflow.Node.prototype.remove = function() {
  $(this.container).children().remove();
  visflow.viewManager.removeNodeView(this.container);
};

/**
 * Hides the port.
 */
visflow.Node.prototype.hide = function() {
  $(this.container).hide();
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
    if (port2.connectable(port).connectable){
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
    left: this.container.position().left,
    top: this.container.position().top,
    width: this.container.width(),
    height: this.container.height()
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
    this.container.css(this.css);
  } else {
    this.container.css(this.visCss);
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
 * Toggles node minimization.
 */
visflow.Node.prototype.toggleMinimized = function() {
  this.options.minimized = !this.options.minimized;
  this.show();
  this.updatePorts();
};

/**
 * Toggles node label.
 */
visflow.Node.prototype.toggleLabel = function() {
  this.options.label = !this.options.label;
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
visflow.Node.prototype.resize = function() {
  var width = this.container.width();
  var height = this.container.height();
  if (visflow.flow.visModeOn == false) {
    this.viewWidth = width;
    this.viewHeight = height;
    _(this.css).extend({
      width: width,
      height: height
    });
    this.updatePorts();
  } else {
    _(this.visCss).extend({
      width: width,
      height: height
    });
  }
};

/**
 * Handles resize stop event.
 */
visflow.Node.prototype.resizeStop = function(size) {
  this.resize(size);
};

/**
 * Displays node options.
 */
visflow.Node.prototype.showPanel = function() {};

/**
 * Displays node details.
 */
visflow.Node.prototype.showDetails = function() {
  this.content.show();
  this.icon.hide();
};

/**
 * Shows the node icon.
 */
visflow.Node.prototype.showIcon = function() {
  this.content.hide();
  this.icon.show();
};