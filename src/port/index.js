/**
 * @fileoverview Port of VisFlow node, used to transmit data.
 */

/**
 * @typedef {{
 *   node: !visflow.Node,
 *   id: string,
 *   text: (string|undefined),
 *   isInput: (boolean|undefined),
 *   fromPort: (string|undefined)
 * }} params
 *     node: Node the port belongs to.
 *     id: Id of the port w.r.t. the node.
 *     text: Text to be displayed for the port as tooltip.
 *     isInput: Whether the port is input port.
 *     fromPort: Port id from which this port gets the data from.
 */
visflow.params.Port;

/**
 * Port constructor.
 * @param {visflow.params.Port} params
 * @abstract
 * @constructor
 */
visflow.Port = function(params) {
  /**
   * Parent node of the port.
   * @type {!visflow.Node}
   */
  this.node = params.node;

  /**
   * Port ID, corresponding to the parent node.
   * @type {string}
   */
  this.id = params.id;

  /**
   * Descriptive text used as tooltip.
   * @protected {string}
   */
  this.text = params.text !== undefined ? params.text : '';

  /** @type {boolean} */
  this.isInput = !!params.isInput;

  /** @type {string} */
  this.fromPort = params.fromPort !== undefined ? params.fromPort : 'in';

  /**
   * List of ports this port is connected to (edges).
   * @type {!Array<!visflow.Edge>}
   */
  this.connections = [];

  /** @type {!jQuery} */
  this.container = $();

  /** @private {boolean} */
  this.changed_ = false;

  /**
   * Package the port currently possesses (subset, constants, generic).
   * @type {!visflow.Package}
   */
  this.pack = new visflow.Package();
};

/** @protected @const {number} */
visflow.Port.prototype.TOOLTIP_DELAY = 500;
/** @protected @const {number} */
visflow.Port.prototype.INFO_LENGTH = 100;

/**
 * Returns an array of port contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.Port.prototype.contextMenuItems = function() {
  return [
    // TODO(bowen): For now there is nothing to do with the generic port port.
  ];
};

/**
 * Checks if more connections can be made on this port.
 * By default each port can only be connected to one other port, so we just
 * negate the length of the connections.
 * @return {boolean}
 */
visflow.Port.prototype.hasMoreConnections = function() {
  return !this.connections.length;
};

/**
 * Checks if the port has been connected.
 * @return {boolean}
 */
visflow.Port.prototype.connected = function() {
  return this.connections.length > 0;
};

/**
 * Checks if a port is connectable:
 *   - It has not been connected to its max capacity.
 *   - Connecting will not result in cyclic graph.
 * @param {!visflow.Port} port
 * @return {{
 *   connectable: boolean,
 *   reason: (string|undefined)
 * }}
 */
visflow.Port.prototype.connectable = function(port) {
  var result = {
    connectable: false
  };
  if (this.node === port.node) {
    return _.extend(result, {
      reason: 'cannot connect ports of the same node'
    });
  }
  if (!this.hasMoreConnections() || !port.hasMoreConnections()) {
    return _.extend(result, {
      reason: 'single port has already been connected'
    });
  }
  for (var i = 0; i < this.connections.length; i++) {
    var edge = this.connections[i];
    if (this.isInput && edge.sourcePort === port ||
        !this.isInput && edge.targetPort === port) {
      return _.extend(result, {
        reason: 'connection already exists'
      });
    }
  }
  var sourceNode = this.isInput ? port.node : this.node;
  var targetNode = this.isInput ? this.node : port.node;
  if (visflow.flow.cycleTest(sourceNode, targetNode)) {
    return _.extend(result, {
      reason: 'cannot make connection that results in cycle'
    });
  }
  return _.extend(result, {
    connectable: true
  });
};

/**
 * Connects a port with an edge.
 * @param {!visflow.Edge} edge
 */
visflow.Port.prototype.connect = function(edge) {
  this.connections.push(edge);
  this.onConnected(edge);

  // Update is required on the downflow node so that it becomes aware of the
  // upflow changes.
  visflow.flow.propagate(edge.targetNode);
};

/**
 * Provides handler for the event of port being connected.
 * @param {!visflow.Edge} edge
 * @protected
 */
visflow.Port.prototype.onConnected = function(edge) {};

/**
 * Disconnects an edge from the port.
 * @param {!visflow.Edge} edge
 */
visflow.Port.prototype.disconnect = function(edge) {
  for (var i = 0; i < this.connections.length; i++) {
    if (this.connections[i] === edge) {
      this.connections.splice(i, 1);
      break;
    }
  }
  this.onDisconnected(edge);
};

/**
 * Provides handler for the event of port being disconnected.
 * @param {!visflow.Edge} edge
 * @protected
 */
visflow.Port.prototype.onDisconnected = function(edge) {};

/**
 * Sets the jQuery container of the port.
 * @param {!jQuery} container
 */
visflow.Port.prototype.setContainer = function(container) {
  this.container = container;

  this.container
    .attr('id', this.id)
    .addClass('port')
    .addClass(this.isInput ? 'left' : 'right')
    .tooltip({
      title: this.info.bind(this),
      placement: this.isInput ? 'right' : 'left',
      delay: this.TOOLTIP_DELAY
    });

  $('<div></div>')
    .addClass('port-icon')
    .appendTo(this.container);

  $('<div></div>')
    .addClass('background')
    .appendTo(this.container);

  this.initContextMenu();
  this.interaction();
};

/**
 * Prepares the contextMenu for the port.
 * @return {!visflow.ContextMenu}
 */
visflow.Port.prototype.initContextMenu = function() {
  var contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.contextMenuItems()
  });

  $(contextMenu)
    .on('vf.disconnect', function() {
      this.connections.concat().forEach(function(connection) {
        visflow.flow.deleteEdge(connection);
      });
    }.bind(this))
    .on('vf.flowSense', function() {
      visflow.nlp.input(this.node);
    }.bind(this));

  return contextMenu;
};

/**
 * Displays a tooltip for the port information.
 * @return {string}
 */
visflow.Port.prototype.info = function() {
  return '';
};

/**
 * Prepares the interaction of the port.
 * @protected
 */
visflow.Port.prototype.interaction = function() {
  this.container
    .dblclick(function() {
      this.info();
      // For debugging.
      console.log(this.pack, this);
    }.bind(this))
    .mouseenter(function() {
      this.connections.forEach(function(connection) {
        connection.addHover();
      });
    }.bind(this))
    .mouseleave(function() {
      visflow.flow.clearEdgeHover();
    }.bind(this))
    .draggable({
      helper: function() {
        return $('<div></div>');
      },
      start: function(event) {
        visflow.interaction.dragstartHandler({
          type: 'port',
          port: this,
          event: event
        });
      }.bind(this),
      drag: function(event) {
        visflow.interaction.dragmoveHandler({
          type: 'port',
          port: this,
          event: event
        });
      }.bind(this),
      stop: function(event) {
        visflow.interaction.dragstopHandler({
          type: 'port',
          event: event
        });
      }.bind(this)
    })
    .droppable({
      hoverClass: 'hover',
      tolerance: 'pointer',
      accept: this.isInput ? '.port.right' : '.port.left',
      greedy: true,
      drop: function(event) {
        visflow.interaction.dropHandler({
          type: 'port',
          port: this,
          event: event
        });
      }.bind(this)
    });
};


/**
 * Gets the center coordinates of the port.
 * @return {{left: number, top: number}}
 */
visflow.Port.prototype.getCenter = function() {
  var offset = visflow.utils.offsetMain(this.container);
  return {
    left: offset.left + this.container.width() / 2,
    top: offset.top + this.container.height() / 2
  };
};

/**
 * Sets/gets the changed state of the port.
 * @param {boolean=} opt_value
 * @return {boolean}
 */
visflow.Port.prototype.changed = function(opt_value) {
  if (opt_value != undefined) {
    return this.changed_ = opt_value;
  }
  for (var i = 0; i < this.connections.length; i++) {
    var edge = this.connections[i];
    var port = this.isInput ? edge.sourcePort : edge.targetPort;
    if (port.getChanged()) {
      return this.changed_ = true;
    }
  }
  return this.changed_ = false;
};

/**
 * Gets the changed_ flag. This method does not derive changed_ state from
 * connected neighbors.
 * @return {boolean}
 */
visflow.Port.prototype.getChanged = function() {
  return this.changed_;
};

/**
 * Checks if the port data is empty. To be implemented in inheriting classes.
 * Always returns false here.
 * @return {boolean}
 */
visflow.Port.prototype.isEmpty = function() {
  return false;
};

/**
 * Gets the subset from the port. If the port does not produce a subset,
 * the method should panic (constant or generic).
 * @return {!visflow.Subset}
 */
visflow.Port.prototype.getSubset = function() {
  visflow.error('cannot serialize port data to subset');
  return new visflow.Subset();
};
