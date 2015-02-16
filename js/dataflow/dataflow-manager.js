
/*
 *
 * DataflowManager handles all operations related to dataflow graph
 * Currently, we assume only one graph is being editted at any time
 * So the dataflow manager equivalently represent the graph itself
 *
 */

"use strict";

var extObject = {
  dataSources: [],
  initialize: function() {
    this.nodeCounter = 0;
    this.visCounter = 0;
    this.edgeCounter = 0;
    this.nodes = {};
    this.edges = {};
  },
  createNode: function(type) {
    var newnode, dataflowClass;
    switch (type) {

    // data source
    case "datasrc":
    case "intersect":
    case "union":
    case "minus":
    case "value":
      if (type === "datasrc")
        dataflowClass = DataflowDataSource;
      if (type === "intersect")
        dataflowClass = DataflowIntersect;
      if (type === "minus")
        dataflowClass = DataflowMinus;
      if (type === "union")
        dataflowClass = DataflowUnion;
      if (type === "value")
        dataflowClass = DataflowValueExtractor;
      newnode = dataflowClass.new({
        nodeid: ++this.nodeCounter
      });
      break;

    // visualizations
    case "table":
    case "scatterplot":
    case "parallelcoordinates":
    case "histogram":
      if (type === "table")
        dataflowClass = DataflowTable;
      if (type === "scatterplot")
        dataflowClass = DataflowScatterplot;
      if (type === "parallelcoordinates")
        dataflowClass = DataflowParallelCoordinates;
      if (type === "histogram")
        dataflowClass = DataflowHistogram;
      newnode = dataflowClass.new({
        nodeid: ++this.nodeCounter,
        visid: ++this.visCounter
      });
      break;
    default:
      console.error("unhandled createNode type", type);
      return;
    }

    var jqview = core.viewManager.createNodeView();
    newnode.setJqview(jqview);
    newnode.show();
    this.nodes[newnode.nodeid] = newnode;
    if (type === "datasrc") {
      this.dataSources.push(newnode);
    }
  },

  cycleTest: function(sourceNode, targetNode) {
    this.visited = {};
    this.visited[sourceNode.nodeid] = true;
    return this.traverse(targetNode);
  },
  traverse: function(node) {
    if (this.visited[node.nodeid]) return true;
    this.visited[node.nodeid] = true;
    for (var i in node.outPorts) {
      var port = node.outPorts[i];
      for (var j in port.connections) {
        if (this.traverse(port.connections[j].targetNode))
          return true;
      }
    }
    return false;
  },

  createEdge: function(sourcePara, targetPara, event) {
    var sourceNode = sourcePara.node,
        targetNode = targetPara.node,
        sourcePort = sourceNode.ports[sourcePara.portid],
        targetPort = targetNode.ports[targetPara.portid];

    var cssparaError = {
      left: event.pageX,
      top: event.pageY
    };
    if (sourceNode === targetNode)
      return core.viewManager.createTip("Cannot connect two ports of the same node", cssparaError);

    if (sourcePort.type === "out-single" && sourcePort.connections.length)
      return core.viewManager.createTip("Out port is single and has already been connected", cssparaError);
    if (targetPort.type === "in-single" && targetPort.connections.length)
      return core.viewManager.createTip("In port is single and has already been connected", cssparaError);

    if (this.cycleTest(sourceNode, targetNode))
      return core.viewManager.createTip("Cannot make connection that results in cycle", cssparaError);

    if (sourcePort.type === "out-multiple" && targetPort.type === "in-multiple") {
      // TODO
      console.log("CODE TODO: need to check if the edge already exists");
    }

    var newedge = DataflowEdge.new({
      edgeid: ++this.edgeCounter,
      sourceNode: sourceNode,
      sourcePort: sourcePort,
      targetNode: targetNode,
      targetPort: targetPort
    });
    sourcePort.connections.push(newedge);
    targetPort.connections.push(newedge);

    var jqview = core.viewManager.createEdgeView();
    newedge.setJqview(jqview);
    newedge.show();
    this.edges[newedge.edgeid] = newedge;
  },

  deleteNode: function(node) {
    for (var key in node.ports) {
      var port = node.ports[key];
      var connections = [];
      // make a copy, because deleteEdge is goingn to traverse adjacency list
      // preventing O(n^2) traversal
      for (var i in port.connections) {
        connections.push(port.connections[i]);
      }
      port.connections = [];
      for (var i in connections) {
        this.deleteEdge(connections[i]);
      }
    }
    node.hide();
    core.viewManager.removeNodeView(node.jqview);
    delete this.nodes[node.nodeid];
  },

  deleteEdge: function(edge) {
    // remove the references in port's connection list
    var sourcePort = edge.sourcePort,
        targetPort = edge.targetPort;
    for (var i in sourcePort.connections) {
      if (sourcePort.connections[i] === edge) {
        sourcePort.connections.splice(i,1);
        break;
      }
    }
    for (var i in targetPort.connections) {
      if (targetPort.connections[i] === edge) {
        targetPort.connections.splice(i,1);
        break;
      }
    }
    edge.hide();
    core.viewManager.removeEdgeView(edge.jqview);
    delete this.edges[edge.edgeid];
  },

  activateNode: function(nodeid) {
    if (this.nodes[nodeid].jqview == null)
      console.error("node does not have jqview");
    core.viewManager.bringFrontView(this.nodes[nodeid].jqview);
  }
};

var DataflowManager = Base.extend(extObject);
