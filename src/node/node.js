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
  this.label = this.NODE_NAME + ' (' + this.id + ')';

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

  this.container.load(this.COMMON_TEMPLATE_, function() {
    this.container
      .addClass('node details')
      .addClass(this.NODE_CLASS)
      .addClass(this.hashtag);

    this.content = this.container.children('.content');

    this.icon = this.container.children('.icon');

    var ready = function() {
      // Call init to prepare node elements.
      this.init();

      // Set up interaction after initialization.
      // This requires node elements to be created beforehand.
      this.interaction();

      // For callback.
      $(this).trigger('visflow.ready');
    }.bind(this);

    if (!this.TEMPLATE) {
      ready();
    } else {
      this.content.load(this.TEMPLATE, ready);
    }
  }.bind(this));
};

/**
 * Node template common template file, containing the popup, background, etc.
 * @private {string}
 */
visflow.Node.prototype.COMMON_TEMPLATE_ = './src/node/node.html';
/**
 * Node content template file.
 * @protected {string}
 */
visflow.Node.prototype.TEMPLATE = '';
/**
 * Node control panel common template file, containing the panel header.
 * @private {string}
 */
visflow.Node.prototype.COMMON_PANEL_TEMPLATE_ = './src/node/node-panel.html';
/**
 * Node control panel template file.
 * @protected {string}
 */
visflow.Node.prototype.PANEL_TEMPLATE = '';

// Minimum size of resizable. Default is no minimum.
/** @protected @const {number} */
visflow.Node.prototype.MIN_WIDTH = 0;
/** @protected @const {number} */
visflow.Node.prototype.MIN_HEIGHT = 0;

/** @protected @const {number} */
visflow.Node.prototype.MAX_LABEL_LENGTH = 11;

/**
 * Whether the node is resizable.
 */
visflow.Node.prototype.RESIZABLE = true;

/** @private @const {number} */
visflow.Node.prototype.TOOLTIP_DELAY_ = 500;

/**
 * Class that defines the node type.
 * @protected @const {string}
 */
visflow.Node.prototype.NODE_CLASS = '';
/**
 * Node name used for label.
 * @protected @const {string}
 */
visflow.Node.prototype.NODE_NAME = 'node';

/** @const {number} */
visflow.Node.prototype.PORT_HEIGHT = 20;
/** @const {number} */
visflow.Node.prototype.PORT_GAP = 1;

/**
 * ContextMenu entries.
 * @protected @const {!Array<!visflow.contextMenu.Entry>}
 */
visflow.Node.prototype.CONTEXTMENU_ITEMS = [
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-minus'},
  {id: 'visMode', text: 'Visualization Mode', icon: 'glyphicon glyphicon-picture'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];

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
  _(this.options).extend(save.options);

  this.label = save.label;

  this.css = save.css;
  this.visCss = save.visCss;

  this.container.css(this.css);

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

  if (!this.options.visMode && visflow.flow.visModeOn) {
    // do not show if hidden in vis mode
    return;
  }
  this.container.show();

  if (this.options.minimized) {
    this.container
      .removeClass('details')
      .addClass('minimized')
      .css({
        width: '',
        height: ''
      })
      .resizable('disable'); // remove constraints set in details mode

    // Hide label when node is minimized.
    this.hideLabel();
    // Hide message when node is minimized.
    this.hideMessage();

    this.showIcon();
  } else {
    this.container
      .addClass('details')
      .removeClass('minimized')
      .css({
        width: this.css.width,
        height: this.css.height
      });

    if (this.RESIZABLE) {
      this.container.resizable('enable');
    }

    // Show label. This has no effect when options.label is false.
    this.showLabel();

    this.showDetails();
  }

  if (!visflow.flow.visModeOn) {
    // not show edges with vis mode on
    this.showPorts();
    this.updatePorts(); // update edges
  } else {
    this.hidePorts();
  }
};

/**
 * Shows the node label.
 */
visflow.Node.prototype.showLabel = function() {
  if (this.options.label) {
    var label = this.label.length > this.MAX_LABEL_LENGTH ?
        this.label.substr(0, this.MAX_LABEL_LENGTH - 3) + '...' : this.label;
    this.container.children('#node-label')
      .text(label)
      .show();
  } else {
    this.container.children('#node-label').hide();
  }
};

/**
 * Sets the node label.
 * @param {string} label
 */
visflow.Node.prototype.setLabel = function(label) {
  this.label = label;
  this.showLabel();
  if (visflow.optionPanel.isOpen) {
    $('#option-panel').find('#node-label').text(label);
  }
};

/**
 * Hides the label even when options.label is true.
 * Called when node is minimized.
 */
visflow.Node.prototype.hideLabel = function() {
  this.container.children('#node-label').hide();
};

/**
 * Focuses the view, brings the view to front.
 */
visflow.Node.prototype.focus = function() {
  $(this.container).css('z-index', visflow.viewManager.topZIndex());
  this.panel();
};


/*
  Node mouse event handlers. When overriding these functions, make sure that
  event propagation are handled properly. Otherwise multiple interaction
  might be triggered.
 */
/**
 * Handles node lick event.
 * @param {!jQuery.event} event
 */
visflow.Node.prototype.click = function() {};
/**
 * Handles mousedown event.
 * @param {!jQuery.event} event
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
 * @param {!jQuery.event} event
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
 * @param {!jQuery.event} event
 */
visflow.Node.prototype.mouseenter = function(event) {
};
/**
 * Handles mouseleave event.
 * @param {!jQuery.event} event
 */
visflow.Node.prototype.mouseleave = function(event) {
};
/**
 * Handles mousemove event.
 * @param {!jQuery.event} event
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
    .mousemove(this.mousemove.bind(this))
    .mouseenter(this.mouseenter.bind(this))
    .mouseleave(this.mouseleave.bind(this));

  // Add event handlers that are always triggered.
  this.container
    .mousedown(function(event) {
      if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
        this.focus();
        visflow.contextMenu.hide();
      }
    }.bind(this))
    .mouseenter(function() {
      this.container.addClass('hover');
    }.bind(this))
    .mouseleave(function() {
      this.container.removeClass('hover');
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
      cancel: 'input, button, a, select, #node-label',
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

  var editDone = function(event) {
    if ($(event.target).attr('contenteditable') == 'false') {
      // When ENTER is pressed, blur will also be fired. In this case we ignore
      // blur.
      return;
    }
    this.setLabel($(event.target).text());
    // Disable the contenteditable.
    $(event.target).attr('contenteditable', false);
  }.bind(this);

  this.container.children('#node-label')
    .mousedown(function(event) {
      // Re-enable the contenteditable on click.
      $(event.target)
        .attr('contenteditable', true)
        .text(this.label);
    }.bind(this))
    .keydown(function(event) {
      if (event.which == visflow.interaction.keyCodes.ENTER) {
        editDone(event);
      }
    }.bind(this))
    .blur(function (event) {
      editDone(event);
    }.bind(this));
};

/**
 * Prepares the contextMenu of the node.
 */
visflow.Node.prototype.initContextMenu = function() {
  this.contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.CONTEXTMENU_ITEMS
  });

  $(this.contextMenu)
    .on('visflow.delete', this.delete.bind(this))
    .on('visflow.minimize', this.toggleMinimized.bind(this))
    .on('visflow.panel', this.panel.bind(this))
    .on('visflow.label', this.toggleLabel.bind(this))
    .on('visflow.visMode', this.toggleVisMode.bind(this));
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

  var height = this.container.innerHeight();

  var portStep = this.PORT_HEIGHT + this.portGap;
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
  var height = this.container.innerHeight();
  var portStep = this.PORT_HEIGHT + this.PORT_GAP;
  var inTopBase = (height - this.inPorts.length * portStep +
      this.PORT_GAP) / 2;
  for (var i in this.inPorts) {
    var port = this.inPorts[i];
    port.container.css('top', inTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
  var outTopBase = (height - this.outPorts.length * portStep +
      this.PORT_GAP) / 2;
  for (var i in this.outPorts) {
    var port = this.outPorts[i];
    port.container.css('top', outTopBase + i * portStep);
    for (var j in port.connections) {
      port.connections[j].update();
    }
  }
};

/**
 * Hides the shown ports.
 */
visflow.Node.prototype.hidePorts = function() {
  this.container.find('.port').hide();
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
 * Updates the node. It checks if the upflow data has changed. If so it
 * processes the node and calls rendering.
 */
visflow.Node.prototype.update = function() {
  if (!this.inPortsChanged()) {
    return; // everything not changed, do not process
  }

  this.process();
  this.show();
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
    top: this.container.position().top
  };
  if (!this.options.minimized) {
    // Do not save css size when node is minimized.
    // Minimized nodes have fixed css.
    _(css).extend({
      width: this.container.width(),
      height: this.container.height()
    });
  }
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
    // Avoid interfering with user typing input.
    return;
  }
  switch(key) {
    case '.':
    case 'ctrl+X':
      visflow.flow.deleteNode(this);
      break;
    case 'M':
      this.toggleMinimized();
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
  this.options.visMode = !this.options.visMode;

  if (visflow.optionPanel.isOpen) {
    var btnVisMode = $('#option-panel').find('#vis-mode');
    if (this.options.visMode) {
      btnVisMode.addClass('active');
    } else {
      btnVisMode.removeClass('active');
    }
  }
};

/**
 * Toggles node minimization.
 */
visflow.Node.prototype.toggleMinimized = function() {
  // Before changing minimized value, we must first save the current css state.
  // If the currently minimized is true, node size will NOT be saved.
  this.saveCss();

  this.options.minimized = !this.options.minimized;
  this.show();
  this.updatePorts();

  if (visflow.optionPanel.isOpen) {
    var btnMinimized = $('#option-panel').find('#minimized');
    if (this.options.minimized) {
      btnMinimized.addClass('active');
    } else {
      btnMinimized.removeClass('active');
      this.resize();
    }
  }
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
  // Push property changes to downflow.
  visflow.flow.propagate(this);
};

/**
 * Handles node resize.
 * @param size
 */
visflow.Node.prototype.resize = function() {
  this.saveCss();
  if (visflow.flow.visModeOn == false) {
    this.updatePorts();
  }
};

/**
 * Handles resize stop event.
 */
visflow.Node.prototype.resizeStop = function(size) {
  this.resize(size);
};

/**
 * Displays node options from the node control panel template.
 */
visflow.Node.prototype.panel = function() {
  visflow.optionPanel.load(this.COMMON_PANEL_TEMPLATE_, function(container) {

    this.initPanelHeader(container);

    // Load type specific node panel.
    if (this.PANEL_TEMPLATE != '') {
      container.find('.panel-content').load(this.PANEL_TEMPLATE, function() {
        this.initPanel(container);
      }.bind(this));
    }
  }.bind(this));
};

/**
 * Initializes the panel header.
 * @param {!jQuery} container
 */
visflow.Node.prototype.initPanelHeader = function(container) {
  var header = container.find('.panel-header');
  header.find('.to-tooltip').tooltip({
    delay: this.TOOLTIP_DELAY_
  });

  // Set label.
  var editDone = function(event) {
    if ($(event.target).attr('contenteditable') == 'false') {
      // When ENTER is pressed, blur will also be fired. In this case we ignore
      // blur.
      return;
    }
    // May contain html tag, ignore.
    this.setLabel($(event.target).text());
    // Disable the contenteditable. Otherwise by default it requires 2 clicks
    // to blur.
    $(event.target).attr('contenteditable', false);
  }.bind(this);

  header.find('#node-label')
    .text(this.label)
    .mousedown(function(event) {
      // Re-enable the contenteditable on click.
      $(event.target).attr('contenteditable', true);
    }.bind(this))
    .keyup(function(event) {
      if (event.which == visflow.interaction.keyCodes.ENTER) {
        editDone(event);
      }
    }.bind(this))
    .blur(function (event) {
      editDone(event);
    }.bind(this));

  // Handle header button clicks.
  if (!visflow.flow.visModeOn) {
    var btnDelete = header.find('#delete').show();
    btnDelete.click(function() {
      this.delete();
    }.bind(this));

    var btnVisMode = header.find('#vis-mode').show();
    btnVisMode.click(function() {
      this.toggleVisMode();
    }.bind(this));
    if (this.options.visMode) {
      btnVisMode.addClass('active');
    }

    var btnMinimized = header.find('#minimized').show();
    btnMinimized.click(function() {
      this.toggleMinimized();
    }.bind(this));
    if (this.options.minimized) {
      btnMinimized.addClass('active');
    }
  }
};

/**
 * Initializes control panel elements when the panel is loaded.
 * @param {!jQuery} container Panel container.
 */
visflow.Node.prototype.initPanel = function(container) {};

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

/**
 * Deletes the node.
 */
visflow.Node.prototype.delete = function() {
  visflow.flow.deleteNode(this);
};

/**
 * Gets the list of dimensions used for select2.
 * @return {!Array<{id: number, text: string}>}
 */
visflow.Node.prototype.getDimensionList = function() {
  var data = this.ports['in'].pack.data;
  return data.dimensions.map(function(dimName, index) {
    return {
      id: index,
      text: dimName
    }
  });
};
