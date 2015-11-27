/**
 * @fileoverview Port of VisFlow node, used to transmit data.
 */

'use strict';

/**
 * Port constructor.
 * @param {!visflow.Node} node Node the port belongs to.
 * @param {string} id Id of the port w.r.t. the node.
 * @param {string} text Text to be displayed on the port.
 * @param {boolean} isConstants Whether the port tranmits data constants.
 * @constructor
 */
visflow.Port = function(node, id, type, text, isConstants) {
  /**
   * Parent node of the port.
   * @type {!visflow.Node}
   */
  this.node = node; // parent node

  /**
   * Port ID, corresponding to the parent node.
   * @type {string}
   */
  this.id = id;

  /**
   * Port type.
   * {in-single, in-multiple, out-single, out-multiple}
   * @param {string}
   */
  this.type = type;

  this.text = text == null ? '' : text;

  /** @type {boolean} */
  this.isInPort = this.type.substr(0, 2) == 'in';
  /** @type {boolean} */
  this.isSingle = this.type.match('single') != null;
   /** @type {boolean} */
  this.isConstants = isConstants == true;

  /**
   * List of ports this port is connected to (edges).
   * @type {!Array<!visflow.Edge>}
   */
  this.connections = [];

  /**
   * Class constructor for the package.
   * @type {visflow.Constants|visflow.Package}
   */
  this.packClass = this.isConstants ? visflow.Constants : visflow.Package;

  /**
   * Package the port currently possesses.
   * @type {visflow.Constants|visflow.Package}
   */
  this.pack = new this.packClass(); // stored data / constants

  /**
   * Port ContextMenu.
   * @private {visflow.ContextMenu}
   */
  this.contextMenu_;

  if (this.isInPort && !this.isSingle) {
    // For in-multiple, use array to store packs.
    // this.pack will be referencing the last connected pack.
    this.packs = [];
  }
};

/**
 * ContextMenu entries.
 * @protected @const {!Array<!visflow.contextMenu.Entry>}
 */
visflow.Port.prototype.CONTEXTMENU_ITEMS = [
  {id: 'disconnect', text: 'Disconnect', icon: 'glyphicon glyphicon-minus-sign'}
];

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
 * @return {*}
 */
visflow.Port.prototype.connectable = function(port) {
  var result = {
    connectable: false
  };
  if (this.node === port.node) {
    return _(result).extend({
      reason: 'cannot connect ports of the same node'
    });
  }
  if (this.isSingle && this.connections.length ||
      port.isSingle && port.connections.length) {
    return _(result).extend({
      reason: 'single port has already been connected'
    });
  }
  if (this.isConstants !== port.isConstants) {
    return _(result).extend({
      reason: 'cannot connect constant port with data port'
    });
  }
  for (var i in this.connections) {
    var edge = this.connections[i];
    if (this.isInPort && edge.sourcePort === port ||
        !this.isInPort && edge.targetPort === port) {
      return _(result).extend({
        reason: 'connection already exists'
      });
    }
  }
  var sourceNode = this.isInPort ? port.node : this.node;
  var targetNode = this.isInPort ? this.node : port.node;
  if (visflow.flow.cycleTest(sourceNode, targetNode)) {
    return _(result).extend({
      reason: 'Cannot make connection that results in cycle'
    });
  }
  return _(result).extend({
    connectable: true
  });
};

/**
 * Connects a port with an edge.
 * @param {!visflow.Edge} edge
 */
visflow.Port.prototype.connect = function(edge) {
  this.connections.push(edge);
  if (this.isInPort) {
    // make data reference, for in-multiple this references the last connected pack
    this.pack = edge.sourcePort.pack;
    if (!this.isSingle) { // in-multiple
      this.packs.push(edge.sourcePort.pack);
    }
  }
  edge.sourcePort.pack.changed = true;

  // Propagation does not include processing the node being propagated.
  // Update is required on the downflow node so that it becomes aware of the
  // upflow changes.
  if (!visflow.flow.propagateDisabled) {
    edge.targetNode.update();
  }
  visflow.flow.propagate(edge.targetNode);
};

/**
 * Disconnects an edge from the port.
 * @param {!visflow.Edge} edge
 */
visflow.Port.prototype.disconnect = function(edge) {
  for (var i in this.connections) {
    if (this.connections[i] === edge) {
      this.connections.splice(i, 1);
      if (this.isInPort && !this.isSingle) {
        this.packs.splice(i, 1);  // also remove from packs for in-multiple
      }
      break;
    }
  }
  if (this.isInPort && this.connections.length == 0) {
    this.pack = new this.packClass();
  }
};

/**
 * Sets the jQuery container of the port.
 * @param {!jQuery} container
 */
visflow.Port.prototype.setContainer = function(container) {
  this.container = this.container = container;

  this.container
    .attr('id', this.id)
    .addClass('port')
    .addClass(this.isInPort ? 'port-in' : 'port-out');

  if (this.isConstants) {
    this.container.addClass('constants');
  }

  $('<div></div>')
    .text(this.text)
    .addClass('port-icon port-icon-'
      + (this.isSingle ? 'single' : 'multiple'))
    .appendTo(this.container);

  $('<div></div>')
    .addClass('background')
    .appendTo(this.container);

  this.initContextMenu();
  this.interaction();
};

/**
 * Prepares the contextMenu for the port.
 */
visflow.Port.prototype.initContextMenu = function() {
  this.contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.CONTEXTMENU_ITEMS
  });

  $(this.contextMenu)
    .on('visflow.disconnect', function() {
      this.connections.concat().forEach(function(connection) {
        visflow.flow.deleteEdge(connection);
      });
    }.bind(this));
};

/**
 * Prepares the interaction of the port.
 */
visflow.Port.prototype.interaction = function() {
  var port = this,
      node = this.node;
  this.container
    .dblclick(function() {
      console.log(port.pack, port.pack.count()); // for debug
    })
    .mouseenter(function(){
      for (var i in port.connections) {
        visflow.viewManager.addEdgeHover(port.connections[i]);
      }
    })
    .mouseleave(function(){
      visflow.viewManager.clearEdgeHover();
    })
    .mousedown(function(event){
      if(event.which == visflow.interaction.keyCodes.RIGHT_MOUSE){

      }
    })
    .draggable({
      helper : function() {
        return $('<div></div>');
      },
      start : function(event) {
        visflow.interaction.dragstartHandler({
          type : 'port',
          port : port,
          event : event
        });
      },
      drag : function(event) {
        visflow.interaction.dragmoveHandler({
          type : 'port',
          port : port,
          event : event
        });
      },
      stop : function(event) {
        visflow.interaction.dragstopHandler({
          type : 'port',
          event : event
        });
      }
    })
    .droppable({
      hoverClass : 'hover',
      tolerance : 'pointer',
      accept : port.isInPort ? '.port-out' : '.port-in',
      greedy : true,
      drop : function(event, ui) {
        visflow.interaction.dropHandler({
          type : 'port',
          port : port,
          event : event
        });
      }
    });
};
