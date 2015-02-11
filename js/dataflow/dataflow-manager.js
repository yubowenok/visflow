
"use strict";

var extObject = {
  edges: {},
  nodes: {},
  dataSources: [],
  initialize: function() {
    this.nodeCounter = 0;
  },
  createNode: function(type) {
    var newnode;
    if (type === "datasrc") {
      newnode = DataflowDataSource.new(this.nodeCounter++);
    }
    var jqview = core.viewManager.createNodeView();
    newnode.setJqview(jqview);
    newnode.show();
    this.nodes[newnode.id] = newnode;
  }
};

var DataflowManager = Base.extend(extObject);
