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
  this.node = node; // parent node

  this.hashtag = 'h-' + visflow.utils.randomString(8); // for serialization

  this.id = id; // port id corresponding to its parent node
  this.type = type; // in-single, in-multiple, out-single, out-multiple

  this.text = text == null ? '' : text; // text to show on port

  this.isInPort = this.type.substr(0, 2) === 'in';
  this.isSingle = this.type.match('single') != null;
  this.isConstants = isConstants === true;

  this.connections = []; // to which other ports it is connected (edges)

  this.packClass = this.isConstants ? visflow.Constants : visflow.Package;

  this.pack = new this.packClass(); // stored data / constants
  if (this.isInPort && !this.isSingle) {
    // for in-multiple, use array to store packs
    // this.pack will be referencing the last connected pack
    this.packs = [];
  }
};

/**
 * Initializes the port.
 */
visflow.Port.prototype.init = function() {
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
 * @return {*}
 */
visflow.Port.prototype.connectable = function(port) {
  if (this.node === port.node) {
    return 'cannot connect ports of the same node';
  }
  if (this.isSingle && this.connections.length ||
      port.isSingle && port.connections.length) {
    return 'single port has already been connected';
  }
  if (this.isConstants !== port.isConstants) {
    return 'cannot connect constant port with data port';
  }
  for (var i in this.connections) {
    var edge = this.connections[i];
    if (this.isInPort && edge.sourcePort === port ||
        !this.isInPort && edge.targetPort === port) {
      return 'connection already exists';
    }
  }
  var sourceNode = this.isInPort ? port.node : this.node;
  var targetNode = this.isInPort ? this.node : port.node;
  if (visflow.flow.cycleTest(sourceNode, targetNode)) {
    return 'Cannot make connection that results in cycle';
  }
  return 0; // Indicates NO error
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
    this.pack = this.packClass.new();
  }
};

/**
 * Sets the jQuery container of the port.
 * @param {!jQuery} jqview
 */
visflow.Port.prototype.setJqview = function(jqview) {
  this.jqview = jqview;

  jqview
    .attr('id', this.id)
    .addClass('port')
    .addClass(this.isInPort ? 'port-in' : 'port-out');

  if (this.isConstants)
    jqview.addClass('port-constants');

  $('<div></div>')
    .text(this.text)
    .addClass('port-icon port-icon-'
      + (this.isSingle ? 'single' : 'multiple'))
    .appendTo(jqview);

  this.prepareInteraction();
};

/**
 * Prepares the interaction of the port.
 */
visflow.Port.prototype.prepareInteraction = function() {
  var port = this,
      node = this.node;
  this.jqview
    .dblclick(function() {
      console.log(port.pack, port.pack.count()); // for debug
    })
    .mouseenter(function(event){
      for (var i in port.connections) {
        visflow.viewManager.addEdgeHover(port.connections[i]);
      }
    })
    .mouseleave(function(event){
      visflow.viewManager.clearEdgeHover();
    })
    .mousedown(function(event){
      if(event.which == 3){
        visflow.interactionManager.contextmenuLock = true;
        var connections = port.connections.concat();
        for(var i in connections) {
          visflow.flow.deleteEdge(connections[i]);
        }
      }
    })
    .draggable({
      helper : function() {
        return $('<div></div>');
      },
      start : function(event, ui) {
        visflow.interactionManager.dragstartHandler({
          type : 'port',
          port : port,
          event : event
        });
      },
      drag : function(event, ui) {
        visflow.interactionManager.dragmoveHandler({
          type : 'port',
          port : port,
          event : event
        });
      },
      stop : function(event, ui) {
        visflow.interactionManager.dragstopHandler({
          type : 'port',
          event : event
        });
      }
    })
    .droppable({
      hoverClass : 'port-hover',
      tolerance : 'pointer',
      accept : port.isInPort ? '.port-out' : '.port-in',
      greedy : true,
      drop : function(event, ui) {
        visflow.interactionManager.dropHandler({
          type : 'port',
          port : port,
          event : event
        });
      }
    });
};
