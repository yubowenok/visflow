
"use strict";

var extObject = {
  edges: {},
  nodes: {},
  dataSources: [],
  initialize: function() {
    this.nodeCounter = 0;
    this.visCounter = 0;
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
    this.nodes[newnode.id] = newnode;
  }
};

var DataflowManager = Base.extend(extObject);
