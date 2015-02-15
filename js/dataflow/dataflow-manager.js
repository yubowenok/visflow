
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

  createEdge: function(sourcePara, targetPara) {
    var sourceNode = sourcePara.node,
        targetNode = targetPara.node,
        sourcePort = sourceNode.ports[sourcePara.portid],
        targetPort = targetNode.ports[targetPara.portid];

    if (sourceNode === targetNode)
      return console.log("cannot connect two ports of the same node");

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

  },

  deleteEdge: function(edge) {

  },

  activateNode: function(nodeid) {
    if (this.nodes[nodeid].jqview == null)
      console.error("node does not have jqview");
    core.viewManager.bringFrontView(this.nodes[nodeid].jqview);
  }
};

var DataflowManager = Base.extend(extObject);
