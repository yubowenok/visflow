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
    icon: false,
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
  this.container = params.container
    .addClass('node')
    .addClass(this.hashtag);
  this.interaction();
};

/**
 * Shape class to set when node details are shown.
 * @protected @const {string}
 */
visflow.Node.prototype.DETAILS_CLASS = 'node-shape';
/**
 * Icon class to set when node details are hidden.
 * @protected @const {string}
 */
visflow.Node.prototype.ICON_CLASS = '';

/**
 * Contextmenu entries.
 * @protected @const {!Array<{id: string, text: string, icon: string}>}
 */
visflow.Node.prototype.CONTEXTMENU_ITEMS = [
  {id: 'delete', text: 'Delete'}
];

/** @const {number} */
visflow.Node.prototype.portHeight = 20;
/** @const {number} */
visflow.Node.prototype.portGap = 4;

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
    optionsOn: this.optionsOn,
    optionsOffset: this.optionsOffset,
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
  if (this.visModeOn == null){
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
 * Shows the node.
 * This removes everything created, including those from inheriting classes.
 * Inheriting classes shall not remove again.
 */
visflow.Node.prototype.show = function() {
  this.container.children()
    .not('.ui-resizable-handle')
    .remove();

  if (!this.visModeOn && visflow.flow.visModeOn) {
    // do not show if hidden in vis mode
    return;
  }
  this.container.show();
  this.showLabel();

  if (this.options.showIcon) {
    this.container
      .removeClass(this.DETAILS_CLASS)
      .addClass(this.ICON_CLASS)
      .css({
        width: '',
        height: ''
      })
      .resizable('disable'); // remove constraints set in details mode
    this.showIcon();
  } else {
    this.container
      .removeClass(this.ICON_CLASS)
      .addClass(this.DETAILS_CLASS);

    this.contextmenu();
    this.showDetails();
  }

  if (!visflow.flow.visModeOn) {
    // not show edges with vis mode on
    this.showPorts();
    this.updatePorts(); // update edges
  }
  this.showOptions();
};

/**
 * Shows the node icon.
 */
visflow.Node.prototype.showIcon = function() {
  this.jqicon = $('<div></div>')
    .addClass(this.ICON_CLASS)
    .appendTo(this.container);
};

/**
 * Shows the node label.
 */
visflow.Node.prototype.showLabel = function() {
  var node = this;
  this.container.find('.node-label').remove();
  if (this.options.label) {
    $('<div></div>')
      .attr('contenteditable', true)
      .addClass('node-label')
      .text(this.label)
      .prependTo(this.container)
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
visflow.Node.prototype.showOptions = function() {
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
visflow.Node.prototype.interaction = function() {
  if (this.nodeInteractionOn) {
    // prevent making interaction twice
    return;
  }

  this.nodeInteractionOn = true;

  var node = this,
      container = this.container;

  this.container
    .mouseenter(function() {
      container.addClass('hover');
    })
    .mouseleave(function() {
      container.removeClass('hover');
    })
    .mousedown(function(event, ui) {
      visflow.contextMenu.hide();
      if (event.which === 1) {
        visflow.flow.activateNode(node.id);
      }
      /*
      else if (event.which === 3) {
        $('.ui-contextmenu')
          .css('z-index', 1000); // over other things
      }
      */
      visflow.interaction.mousedownHandler({
        type: 'node',
        event: event,
        node: node
      });
    })
    .mouseup(function(event, ui) {
      visflow.interaction.mouseupHandler({
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
        visflow.interaction.dragstartHandler({
          type: 'node',
          event: event,
          node: node
        });
      },
      drag: function(event, ui) {
        visflow.interaction.dragmoveHandler({
          type: 'node',
          event: event,
          node: node
        });
        node.updateEdges();
      },
      stop: function(event, ui) {
        visflow.interaction.dragstopHandler({
          type: 'node',
          event: event
        });
      }
   })
   .droppable({
      drop: function(event, ui) {
        visflow.interaction.dropHandler({
          type: 'node',
          event: event,
          node: node
        });
      }
   });
  this.container.resizable('disable');
};

/**
 * Prepares the contextmenu of the node.
 */
visflow.Node.prototype.contextmenu = function() {
  this.contextmenu = new visflow.ContextMenu({
    container: this.container,
    items: this.CONTEXTMENU_ITEMS
  });

  $(this.contextmenu)
    .on('visflow.delete', function() {
      console.log('delete');
    });

  // right-click menu
  /*
  this.container.contextmenu({
    delegate: this.container,
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
    this.container.contextmenu('showEntry', entry, false);
  }
  */
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
 * Runs before contextmenu is about to open.
 * @param {!jQuery.event} event
 * @param {!jQuery.ui} ui
 */
visflow.Node.prototype.contextmenuBeforeOpen = function(event, ui) {
  /*
  if (!this.visModeOn) {
    this.container.contextmenu('setEntry', 'vismode',
      {title: 'Visualization Mode'});
  } else {
    this.container.contextmenu('setEntry', 'vismode',
      {title: 'Visualization Mode', uiIcon: 'ui-icon-check'});
  }
  */
  if (visflow.interaction.contextmenuLock) {
    return false;
  }
  visflow.interaction.contextmenuLock = true;
};

/**
 * Closes the contextmenu of the node.
 */
visflow.Node.prototype.contextmenuClose = function(event, ui) {
  visflow.interaction.contextmenuLock = false;
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
  for (var i in this.inPorts) {
    var port = this.inPorts[i];
    var container = $('<div></div>')
      .css('top', inTopBase + i * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }
  var outTopBase = (height - this.outPorts.length * portStep + this.portGap) / 2;
  for (var i in this.outPorts) {
    var port = this.outPorts[i];
    var container = $('<div></div>')
      .css('top', outTopBase + i * portStep)
      .appendTo(this.container);
    port.setContainer(container);
  }
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
  this.showOptions();
};

/**
 * Toggles node label.
 */
visflow.Node.prototype.toggleLabel = function() {
  if (this.contextmenuDisabled['label'] != null) {
    return;
  }
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


