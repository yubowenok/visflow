/**
 * @fileoverview visflow node module.
 */

/**
 * @typedef {{
 *   id: string,
 *   type: string,
 *   container: !jQuery
 * }}
 */
visflow.params.Node;

/**
 * @param {visflow.params.Node} params
 * @abstract
 * @constructor
 */
visflow.Node = function(params) {
  if (params == null) {
    visflow.error('null params');
    return;
  }

  /**
   * Hash tag used to serialize the diagram.
   * @type {string}
   */
  this.hashtag = 'h-' + visflow.utils.randomString(8); // for serialization

  /**
   * Node ID.
   * @type {string}
   */
  this.id = params.id;

  /**
   * Node type.
   * @type {string}
   */
  this.type = params.type;

  /**
   * Node container.
   * @protected {!jQuery}
   */
  this.container = params.container;

  /**
   * Ports collection. Key is port id.
   * @protected {!Object<!visflow.Port>}
   */
  this.ports = {};

  /**
   * Node options. Default options maybe overwritten by inheriting classes.
   * @protected {!visflow.options.Node}
   */
  this.options = this.defaultOptions();

  /**
   * Node label.
   * @type {string}
   */
  this.label = this.DEFAULT_LABEL + '-' + this.id;

  /**
   * CSS state.
   * @type {!Object}
   */
  this.css = {};
  /**
   * CSS state in visMode.
   * @type {!Object}
   */
  this.visCss = {};

  /**
   * Wrapper for the node content.
   * @protected {!jQuery}
   */
  this.content = $();

  /**
   * Node icon.
   * @protected {!jQuery}
   */
  this.icon = $();

  /**
   * Mouse interaction mode.
   * @protected {string}
   */
  this.mouseMode = '';

  /**
   * Context menu.
   * @protected {!visflow.ContextMenu|undefined}
   */
  this.contextMenu = undefined;

  /**
   * @protected {!Array<visflow.PanelElementSpec>}
   */
  this.panelElements = [];

  /**
   * Flag used to record that the node should go back to minimized mode, usd
   * when the user switch to visMode (turn it on or preview) when this node is
   * minimized.
   * @type {boolean}
   */
  this.backMinimized = false;

  /**
   * Measure of how actively user is using this node.
   * @type {number}
   */
  this.activeness = 0;

  /**
   * Messages to be displayed as popup. The first message will be shown.
   * @private {!Array<string>}
   */
  this.messages_ = [];

  /**
   * Indicates if the the node is one of the propagation starting points.
   * If so, process() will always execute, regardless of whether
   * inPortsChanged() is true.
   * @type {boolean}
   */
  this.isPropagationSource = false;

  this.container.load(this.COMMON_TEMPLATE, function() {
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
      visflow.signal(this, visflow.Event.READY);
    }.bind(this);

    if (!this.TEMPLATE) {
      ready();
    } else {
      this.content.load(this.TEMPLATE, ready);
    }
  }.bind(this));
};

/**
 * Initializes the node. This shall be called after node elements are loaded
 * from template.
 */
visflow.Node.prototype.init = function() {
  this.createPorts();
  this.initContextMenu();
};

/**
 * Serializes the node to be storable JSON.
 * @return {!Object}
 */
visflow.Node.prototype.serialize = function() {
  this.saveCss();
  var result = {
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
 * @param {!visflow.save.Node} save
 */
visflow.Node.prototype.deserialize = function(save) {
  if (save.options == null) {
    visflow.warning('old options data');
    save.options = {
      label: save.labelOn,
      icon: !save.detailsOn,
      visMode: save.visModeOn
    };
  }

  // Merge saved node options with default options
  _.extend(this.options, save.options);
  this.fillOptions(this.options, this.defaultOptions());

  this.label = save.label;

  this.css = save.css;
  this.visCss = save.visCss;

  // Adjust to new smaller node styling.
  this.css.width = Math.min(this.css.width, this.MAX_WIDTH);
  this.css.height = Math.min(this.css.height, this.MAX_HEIGHT);

  this.container.css(this.css);

  if (this.options.visMode == null) {
    visflow.error('visMode not saved');
    this.options.visMode = false;
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
 * Fills the object options by entries from defaultOptions. If an entry from
 * defaultOptions does not exist in options, trigger a warning. This is used
 * in de-serialization.
 * @param {!Object} options
 * @param {!Object} defaultOptions
 */

visflow.Node.prototype.fillOptions = function(options, defaultOptions) {
  for (var key in defaultOptions) {
    if (!(key in options)) {
      visflow.warning(key, 'options not saved in', this.label);
     options[key] = defaultOptions[key];
    }
  }
};

/**
 * Displays a message at the center of the node. "msg" is pushed to the messages
 * queue and the first message is displayed.
 * @param {string} msg
 */
visflow.Node.prototype.showMessage = function(msg) {
  var popup = this.container.children('.popup');
  if (this.messages_.indexOf(msg) == -1) {
    this.messages_.push(msg);
  }
  popup.children('.text').text(this.messages_[0]);
  popup.show();
};

/**
 * Hides the node message.
 * @param {visflow.Node.Message=} opt_msg Removes a message from the message
 *     queue. If this results in the message queue becomes empty, then hides the
 *     message popup. If this is not set, the message queue is kept as is but
 *     hides the popup.
 */
visflow.Node.prototype.hideMessage = function(opt_msg) {
  var popup = this.container.children('.popup');
  if (opt_msg == undefined) {
    popup.hide();
    return;
  }
  var index = this.messages_.indexOf(opt_msg);
  if (index != -1) {
    this.messages_.splice(index, 1);
  }
  if (!this.messages_.length) {
    popup.hide();
  } else {
    // show the first message in queue
    this.showMessage(this.messages_[0]);
  }
};

/**
 * Updates the node content without changing wrapping stuffs.
 */
visflow.Node.prototype.updateContent = function() {
  if (this.options.minimized) {
    this.showIcon();
  } else {
    this.showDetails();
  }
};

/**
 * Updates the node containing elements, so that they correspond to details/
 * minimized state.
 * @private
 */
visflow.Node.prototype.updateContainer_ = function() {
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
  } else {
    this.container
      .addClass('details')
      .removeClass('minimized')
      .css({
        width: visflow.flow.visMode ? this.visCss.width : this.css.width,
        height: visflow.flow.visMode ? this.visCss.height : this.css.height
      });

    if (this.RESIZABLE) {
      this.container.resizable('enable');
    }

    // Show label. This has no effect when options.label is false.
    this.showLabel();
  }
};

/**
 * Shows the node.
 * This removes everything created, including those from inheriting classes.
 * Inheriting classes shall not remove again.
 */
visflow.Node.prototype.show = function() {
  this.container.show();

  this.updateContainer_();
  this.updateContent();

  if (!visflow.flow.visMode) {
    // Not show edges with vismode on.
    this.showPorts();
    this.updatePorts();
  } else {
    this.hidePorts();
  }
};

/**
 * Shows the node label.
 */
visflow.Node.prototype.showLabel = function() {
  if (this.options.label && visflow.options.nodeLabel) {
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


// Node mouse event handlers. When overriding these functions, make sure that
// event propagation are handled properly. Otherwise multiple interaction might
// be triggered.
/**
 * Handles node lick event.
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
 */
visflow.Node.prototype.click = function(event) {};

/**
 * Handles mousedown event.
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
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
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
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
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
 */
visflow.Node.prototype.mouseenter = function(event) {};

/**
 * Handles mouseleave event.
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
 */
visflow.Node.prototype.mouseleave = function(event) {};

/**
 * Handles mousemove event.
 * @param {!jQuery.Event} event
 * @return {boolean|undefined}
 */
visflow.Node.prototype.mousemove = function(event) {};


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
        var shifted = visflow.interaction.isPressed(
            visflow.interaction.keyCodes.SHIFT);
        if (!shifted && !this.container.hasClass('selected')) {
          // It may be tempting to press ALT and then drag a visualization, in
          // which case we shall only move the newly selected node.
          // However if the node is already selected, ALT + drag means to move
          // all the selected group and we shall not clear previous selection.
          visflow.flow.clearNodeSelection();
        }
        visflow.flow.addNodeSelection(this);
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
      maxWidth: this.MAX_WIDTH,
      maxHeight: this.MAX_HEIGHT,
      resize: function() {
        this.saveCss();
        this.resize();
      }.bind(this),
      stop: function() {
        this.resizeStop();
      }.bind(this)
    })
    .draggable({
      cancel: 'input, button, a, select.form-control, #node-label, ' +
        '.select2-selection',
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
    this.setLabel(/** @type {string} */($(event.target).text()));
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
    .blur(function(event) {
      editDone(event);
    }.bind(this));
};

/**
 * Prepares the contextMenu of the node.
 */
visflow.Node.prototype.initContextMenu = function() {
  var items = this.contextMenuItems();
  this.contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: items
  });

  visflow.listen(this.contextMenu, visflow.Event.VISMODE,
    this.toggleVisMode.bind(this));

  $(this.contextMenu)
    .on('vf.delete', this.delete.bind(this))
    .on('vf.minimize', this.toggleMinimized.bind(this))
    .on('vf.panel', this.panel.bind(this))
    .on('vf.label', this.toggleLabel.bind(this))
    //.on('vf.flowSense', this.flowSenseInput.bind(this))
    .on('vf.beforeOpen', function(event, menuContainer) {
      var minimize = menuContainer.find('#minimize');
      if (this.options.minimized) {
        minimize.children('.glyphicon')
          .addClass('glyphicon-resize-full')
          .removeClass('glyphicon-resize-small');
        minimize.children('span:first')
          .text('Maximize');
        minimize.children('span:last')
          .text('(M)');
      }
      items.forEach(function(item) {
        if (item.bind) {
          var check = menuContainer.find('#' + item.id).children('.glyphicon');
          check.toggleClass('glyphicon-ok', this.options[item.bind]);
        }
      }, this);
      if (visflow.flow.visMode) {
        minimize.hide();
      }
    }.bind(this));
};

/**
 * Generates a dimension list of the node to be selected.
 * @param {Array<string>} ignoreTypes
 * @return {!Array<{value: number, text: string}>}
 */
visflow.Node.prototype.prepareDimensionList = function(ignoreTypes) {
  if (ignoreTypes == null) {
    ignoreTypes = [];
  }

  var inpack = this.getDataInPort().pack;
  if (inpack.isEmptyData())
    return [];
  var dims = inpack.data.dimensions,
      dimTypes = inpack.data.dimensionTypes;
  var list = [];
  for (var i = 0; i < dims.length; i++) {
    if (ignoreTypes.indexOf(dimTypes[i]) != -1) {
      continue;
    }
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
    for (var i = 0; i < port.connections.length; i++) {
      var edge = port.connections[i];
      edge.update();
    }
  }
};

/**
 * Creates and shows all the ports.
 */
visflow.Node.prototype.createPorts = function() {
  this.container.find('.port').remove();

  var height = this.container.innerHeight();

  var inPorts = this.inputPorts();
  var portStep = this.PORT_HEIGHT + this.PORT_GAP;
  var inTopBase = (height - inPorts.length * portStep +
    this.PORT_GAP) / 2;
  inPorts.forEach(function(port, index) {
    var container = $('<div></div>')
      .css('top', inTopBase + index * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }, this);

  var outPorts = this.outputPorts();
  var outTopBase = (height - outPorts.length * portStep +
    this.PORT_GAP) / 2;
  outPorts.forEach(function(port, index) {
    var container = $('<div></div>')
      .css('top', outTopBase + index * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }, this);

  this.updatePorts();
};

/**
 * Shows all the ports.
 */
visflow.Node.prototype.showPorts = function() {
  this.container.find('.port').show();
};

/**
 * Updates port rendering based on new node sizes.
 */
visflow.Node.prototype.updatePorts = function() {
  var height = this.container.innerHeight();
  var portStep = this.PORT_HEIGHT + this.PORT_GAP;

  var inPorts = this.inputPorts();
  var inTopBase = (height - inPorts.length * portStep +
      this.PORT_GAP) / 2;
  for (var i = 0; i < inPorts.length; i++) {
    var port = inPorts[i];
    port.container.css('top', inTopBase + i * portStep);
    for (var j = 0; j < port.connections.length; j++) {
      port.connections[j].update();
    }
  }

  var outPorts = this.outputPorts();
  var outTopBase = (height - outPorts.length * portStep +
      this.PORT_GAP) / 2;
  for (var i = 0; i < outPorts.length; i++) {
    var port = outPorts[i];
    port.container.css('top', outTopBase + i * portStep);
    for (var j = 0; j < port.connections.length; j++) {
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
 * @return {visflow.Port} null if no port is connectable.
 */
visflow.Node.prototype.firstConnectable = function(port) {
  var ports = port.isInput ? this.outputPorts() : this.inputPorts();
  for (var i = 0; i < ports.length; i++) {
    var port2 = ports[i];
    var connectableResult = port2.connectable(port);
    if (connectableResult.connectable) {
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
  var inPorts = this.inputPorts();
  if (!inPorts.length) {
    return true; // For nodes without inputs, always return true.
  }
  for (var i = 0; i < inPorts.length; i++) {
    if (inPorts[i].changed()) {
      return true;
    }
  }
  return false;
};

/**
 * Processes input data and generates output. Updates and re-renders the node
 * if the input data has chnaged.
 * This is to be implemented in inheriting classes.
 * [Warning!]
 * Otherwise the flow would endlessly call process().
 */
visflow.Node.prototype.process = function() {
  // During propagation, every node that is potentially touched will be marked
  // 'waiting'. Once it is this node's turn to update(), remove the waiting
  // message.
  this.hideMessage(visflow.Node.Message.WAITING);

  this.startProcess_();

  // Mark all output ports changed. Note that this is not optimized for
  // performance. If a node's processSync/processAsync implementation can
  // determine that some ports possess the same package before and after, it
  // should unset the changed flag on the ports to prevent unnecessary
  // propagation.
  this.outputPorts().forEach(function(port) { port.changed(true); });

  if (!this.isPropagationSource && !this.inPortsChanged()) {
    // Everything not changed, do not process and just signifies endProcess.
    this.endProcess_();
    return;
  }
  if (this.isAsyncProcess) {
    this.processAsync(this.endProcess_.bind(this));
  } else {
    this.processSync();
    this.endProcess_();
  }
};

/**
 * To be implemented by inheriting classes. Synchronously processes the node.
 * [Warning!] You cannot call propagate in processSync(). This function is
 * supposed to only compute its output values based on its input.
 */
visflow.Node.prototype.processSync = function() {
  visflow.error('processSync is not implemented but called on node', this.id,
    'type', this.type);
};

/**
 * To be implemented by inheriting classes.
 * Asynchronously processes the node.
 * [Warning!] You cannot call propagate in processAsync(). This function is
 * supposed to only compute its output values based on its input.
 *
 * @param {Function} endProcess You must call endProcess() once the processing
 *     ends in order to make the flow propagate properly.
 */
visflow.Node.prototype.processAsync = function(endProcess) {
  visflow.error('processAsync is not implemented but called on node', this.id,
    'type', this.type);
};

/**
 * Notifies the data flow that this node has change in its output, which should
 * be propagated to the downflow. Only call this function when the node has
 * completed its process() and its outputs are ready.
 * [Warning!] You should only call this when a change comes from the UI (user).
 * Do not call pushflow within propagation (along with process) otherwise the
 * performance would seriously downgrade.
 */
visflow.Node.prototype.pushflow = function() {
  visflow.flow.propagate(this);
};

/**
 * Signifies that the process() of the node has started. This creates a popup
 * cover on the node that shows "processing" to the user.
 * @private
 */
visflow.Node.prototype.startProcess_ = function() {
  this.showMessage(visflow.Node.Message.PROCESSING);
};

/**
 * Signifies that the process() has ended.
 * @private
 */
visflow.Node.prototype.endProcess_ = function() {
  this.show();

  // Signals that the node has completed process(). This is to notify other
  // downflow nodes to update based on its new output.
  visflow.signal(this, visflow.Event.PROCESSED, {node: this});

  this.hideMessage(visflow.Node.Message.PROCESSING);
};

/**
 * Shows that the node is waiting to be processed.
 */
visflow.Node.prototype.wait = function() {
  this.showMessage(visflow.Node.Message.WAITING);
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
    _.extend(css, {
      width: this.container.width(),
      height: this.container.height()
    });
  }
  if (!visflow.flow.visMode) {
    _.extend(this.css, css);
  } else {
    _.extend(this.visCss, css);
  }
};

/**
 * Applies css specification.
 */
visflow.Node.prototype.loadCss = function() {
  if (!visflow.flow.visMode) {
    this.container.css(this.css);
  } else {
    this.container.css(this.visCss);
  }
};

/**
 * Handles key events.
 * @param {string} key
 * @param {!jQuery.Event} event
 */
visflow.Node.prototype.keyAction = function(key, event) {
  if ($(event.target).is('input')) {
    // Avoid interfering with user typing input.
    return;
  }
  switch (key) {
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
    /*
    case 'S':
      event.preventDefault(); // Avoid 'S' typed into NLP input.
      this.flowSenseInput();
      break;
    */
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
 * Sets the minimization without saving state.
 * @param {boolean} state
 */
visflow.Node.prototype.setMinimized = function(state) {
  this.options.minimized = state;
  this.show();
  this.updatePorts();
  if (visflow.optionPanel.isOpen) {
    var btnMinimized = $('#option-panel').find('#minimized');
    if (this.options.minimized) {
      btnMinimized.addClass('active');
    } else {
      btnMinimized.removeClass('active');
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

  this.setMinimized(!this.options.minimized);
};

/**
 * Toggles node label.
 */
visflow.Node.prototype.toggleLabel = function() {
  this.options.label = !this.options.label;
  this.showLabel();
};

/**
 * Handles node resize.
 */
visflow.Node.prototype.resize = function() {
  if (visflow.flow.visMode == false) {
    this.updatePorts();
  }
};

/**
 * Sets the size of the node.
 * @param {?number=} opt_width
 * @param {?number=} opt_height
 */
visflow.Node.prototype.setSize = function(opt_width, opt_height) {
  if (opt_width) {
    this.container.width(opt_width);
  }
  if (opt_height) {
    this.container.height(opt_height);
  }
};

/**
 * Handles resize stop event.
 */
visflow.Node.prototype.resizeStop = function() {
  this.resize();
};

/**
 * Displays node options from the node control panel template.
 */
visflow.Node.prototype.panel = function() {
  if (visflow.flow.deserializing) {
    // Not popping up panels during de-serialization.
    return;
  }

  if (visflow.optionPanel.isOpen && visflow.optionPanel.loadedNode() == this) {
    this.updatePanel(visflow.optionPanel.contentContainer());
    return;
  }

  visflow.optionPanel.setLoadedNode(this);
  visflow.optionPanel.load(this.COMMON_PANEL_TEMPLATE, function(container) {
    this.initPanelHeader(container);
    // Load type specific node panel.
    if (this.PANEL_TEMPLATE != '') {
      container.find('.panel-content').load(this.PANEL_TEMPLATE, function() {
        this.updatePanel(container);
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
    delay: this.TOOLTIP_DELAY
  });

  // Set label.
  var editDone = function(event) {
    if ($(event.target).attr('contenteditable') == 'false') {
      // When ENTER is pressed, blur will also be fired. In this case we ignore
      // blur.
      return;
    }
    // May contain html tag, ignore.
    this.setLabel(/** @type {string} */($(event.target).text()));
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
    .blur(function(event) {
      editDone(event);
    }.bind(this));

  // Handle header button clicks.
  if (!visflow.flow.visMode) {
    var btnMinimized = header.find('#minimized').show();
    btnMinimized.click(function() {
        this.toggleMinimized();
        btnMinimized.toggleClass('active', this.options.minimized);
      }.bind(this))
      .toggleClass('active', this.options.minimized);

    var btnVisMode = header.find('#vis-mode').show();
    btnVisMode.click(function() {
        this.toggleVisMode();
        btnVisMode.toggleClass('active', this.options.visMode);
      }.bind(this))
      .toggleClass('active', this.options.visMode);

    var btnLabel = header.find('#label').show();
    btnLabel.click(function() {
        this.toggleLabel();
        btnLabel.toggleClass('active', this.options.label);
      }.bind(this))
      .toggleClass('active', this.options.label);

    var btnDelete = header.find('#delete').show();
    btnDelete.click(function() {
      this.delete();
    }.bind(this));
  }
};

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
 * Removes the incident edges of the node.
 */
visflow.Node.prototype.removeEdges = function() {
  for (var key in this.ports) {
    var port = this.ports[key];
    var connections = port.connections.slice();
    // cannot use port.connections, because the length is changing
    for (var i = 0; i < connections.length; i++) {
      visflow.flow.deleteEdge(connections[i]);
    }
  }
};

/**
 * Gets the list of dimensions from the input data.
 * This is used for select2 input.
 * @param {(visflow.Dataset|visflow.TabularData)=} opt_data
 * @param {boolean=} opt_addIndex
 * @return {!Array<{id: number, text: string}>}
 */
visflow.Node.prototype.getDimensionList = function(opt_data, opt_addIndex) {
  var data = opt_data == null ? this.getDataInPort().pack.data : opt_data;
  var result = data.dimensions.map(function(dimName, index) {
    return {
      id: index,
      text: dimName
    };
  });
  if (opt_addIndex) {
    return [{
      id: visflow.data.INDEX_DIM,
      text: visflow.data.INDEX_TEXT
    }].concat(result);
  }
  return result;
};

/**
 * Gets the list of dimensions names the input data.
 * @return {!Array<string>}
 */
visflow.Node.prototype.getDimensionNames = function() {
  return this.getDataInPort().pack.data.dimensions;
};

/**
 * Gets the port with the given id.
 * @param {string} id
 * @return {!visflow.Port}
 */
visflow.Node.prototype.getPort = function(id) {
  return this.ports[id];
};

/**
 * Gets all input ports of the node.
 * @return {!Array<!visflow.Port>}
 */
visflow.Node.prototype.inputPorts = function() {
  var inPorts = [];
  _.each(this.ports, function(port) {
    if (port.isInput) {
      inPorts.push(port);
    }
  });
  return inPorts;
};

/**
 * Gets all output ports of the node.
 * @return {!Array<!visflow.Port>}
 */
visflow.Node.prototype.outputPorts = function() {
  var outPorts = [];
  _.each(this.ports, function(port) {
    if (!port.isInput) { // port is either input or output
      outPorts.push(port);
    }
  });
  return outPorts;
};

/**
 * Gets all ports of the node.
 * @return {!Array<!visflow.Port>}
 */
visflow.Node.prototype.allPorts = function() {
  return this.inputPorts().concat(this.outputPorts());
};

/**
 * Gets all nodes that this node is connected to from its input ports.
 * @return {!Array<!visflow.Node>}
 */
visflow.Node.prototype.inputSourceNodes = function() {
  var nodes = [];
  var nodeIds = {}; // used to deduplicate
  this.inputPorts().forEach(function(port) {
    port.connections.forEach(function(edge) {
      var node = edge.sourceNode;
      if (!(node.id in nodeIds)) {
        nodeIds[node.id] = true;
        nodes.push(node);
      }
    });
  });
  return nodes;
};

/**
 * Gets all nodes that this node is connected to from its output ports.
 * @return {!Array<!visflow.Node>}
 */
visflow.Node.prototype.outputTargetNodes = function() {
  var nodes = [];
  var nodeIds = {}; // used to deduplicate
  this.outputPorts().forEach(function(port) {
    port.connections.forEach(function(edge) {
      var node = edge.targetNode;
      if (!(node.id in nodeIds)) {
        nodeIds[node.id] = true;
        nodes.push(node);
      }
    });
  });
  return nodes;
};

/**
 * Gets the container of the node.
 * @return {!jQuery}
 */
visflow.Node.prototype.getContainer = function() {
  return this.container;
};

/**
 * Gets the location of the node (top, left).
 * @return {{left: number, top: number}}
 */
visflow.Node.prototype.getCenter = function() {
  var offset = visflow.utils.offsetMain(this.container);
  var size = this.getSize();
  return {
    left: offset.left + size.width / 2,
    top: offset.top + size.height / 2
  };
};

/**
 * Gets the size of the node container.
 * @return {{width: number, height: number}}
 */
visflow.Node.prototype.getSize = function() {
  var w = /** @type {number} */(this.container.outerWidth());
  var h = /** @type {number} */(this.container.outerHeight());
  return {width: w, height: h};
};

/**
 * Gets the bounding box of the node container.
 * @return {{left: number, top: number, width: number, height: number}}
 */
visflow.Node.prototype.getBoundingBox = function() {
  var offset = this.container.position();
  var size = this.getSize();
  return {
    left: offset.left,
    top: offset.top,
    width: size.width,
    height: size.height
  };
};

/**
 * Moves the node to a given position.
 * @param {number} left
 * @param {number} top
 */
visflow.Node.prototype.moveTo = function(left, top) {
  this.container.css({left: left, top: top});
  this.updatePorts(); // Must redraw connections.
};

/**
 * Moves the node to a given position with transition.
 * @param {number} left
 * @param {number} top
 * @param {number=} opt_duration Transition duration
 */
visflow.Node.prototype.moveToWithTransition = function(left, top,
                                                       opt_duration) {
  var duration = opt_duration !== undefined ?
    opt_duration : visflow.const.DEFAULT_TRANSITION_DURATION;
  this.container.animate({
    left: left,
    top: top
  }, {
    duration: duration,
    step: function() {
      this.updatePorts();
    }.bind(this)
  });
};

/**
 * Gets node option identified by key.
 * @param {string} key
 * @return {*}
 */
visflow.Node.prototype.getOption = function(key) {
  return this.options[key];
};

/**
 * Gets the node class.
 * @return {string}
 */
visflow.Node.prototype.getClass = function() {
  return this.NODE_CLASS;
};

/**
 * Gets the node's data.
 * @return {!visflow.Dataset}
 */
visflow.Node.prototype.getData = function() {
  return this.getDataOutPort().pack.data;
};

/**
 * Checks if the node's type matches the desired string.
 * @param {string} desired
 * @return {boolean}
 */
visflow.Node.prototype.matchType = function(desired) {
  var nodeClass = this.NODE_CLASS.toLowerCase().replace(/[\s-]+/g, '');
  desired = desired.toLowerCase().replace(/[\s-]+/g, '');
  return nodeClass == desired;
};

/**
 * Checks if the node's label matches the desired string.
 * @param {string} desired
 * @return {boolean}
 */
visflow.Node.prototype.matchLabel = function(desired) {
  var nodeLabel = this.label.toLowerCase().replace(/[\s-]+/g, '');
  desired = desired.toLowerCase().replace(/[\s-]+/g, '');
  return nodeLabel == desired;
};

/**
 * Sets the selected state of the node. When selected, the node animates a
 * selected effect.
 * @param {boolean} state
 */
visflow.Node.prototype.toggleSelected = function(state) {
  var background = this.container.children('.background');
  this.container.toggleClass('selected', state);
  if (state) {
    var darkCss = {boxShadow: '1px 1px 24px #aaa'};
    var lightCss = {boxShadow: '1px 1px 2px #aaa'};
    var darker = function() {
      background.animate(darkCss, lighter);
    };
    var lighter = function() {
      background.animate(lightCss, darker);
    };
    background.animate(darkCss, lighter);
  } else {
    background
      .css('box-shadow', '')
      .stop(true);
  }
};

/**
 * Accepts FlowSense input.
 */
visflow.Node.prototype.flowSenseInput = function() {
  visflow.nlp.input(this);
};

/**
 * Shows animation towards the node's VisMode on state.
 */
visflow.Node.prototype.animateToVisModeOn = function() {
  this.container.stop(true, true);
  this.saveCss();

  if (this.options.visMode) {
    this.container
      .animate(this.visCss, visflow.const.VISMODE_TRANSITION_DURATION,
        function() {
          if (this.options.minimized) {
            this.backMinimized = true;
            this.setMinimized(false); // here include show
          } else {
            this.show();
          }
        }.bind(this));
  } else {
    this.container
      .css('pointer-events', 'none')
      .animate({opacity: 0}, visflow.const.VISMODE_TRANSITION_DURATION,
        this.hide.bind(this));
  }
};

/**
 * Shows animation towards the node's VisMode off state.
 */
visflow.Node.prototype.animateToVisModeOff = function() {
  this.container.stop(true, true);
  this.saveCss();

  if (this.options.visMode) {
    var css = this.css;
    if (this.backMinimized) {
      this.backMinimized = false;
      this.setMinimized(true);
      css = _.pick(this.css, 'left', 'top');
    }
    this.container
      .animate(css, visflow.const.VISMODE_TRANSITION_DURATION,
        this.show.bind(this));
  } else {
    this.container
      .css('pointer-events', 'auto')
      .animate({opacity: 1}, visflow.const.VISMODE_TRANSITION_DURATION,
        this.show.bind(this));
  }
};

/**
 * Returns the distance from the center of the node to the mouse position.
 * @return {number}
 */
visflow.Node.prototype.distanceToMouse = function() {
  var center = this.getCenter();
  return visflow.vectors.vectorDistance([center.left, center.top],
    [visflow.interaction.mouseX, visflow.interaction.mouseY]);
};

/**
 * Computes the focus score for the node.
 * @return {number}
 */
visflow.Node.prototype.focusScore = function() {
  var d = this.distanceToMouse() / visflow.Node.FOCUS_GAMMA;

  // dFactor is the flipped & shifted sigmoid function
  // 1 - 1 / (1 + e^-(d/gamma - beta))
  var dFactor = (1.0 - 1.0 /
  (1 + Math.exp(-(d - visflow.Node.FOCUS_BETA))));

  return this.activeness + visflow.Node.FOCUS_ALPHA * dFactor;
};
