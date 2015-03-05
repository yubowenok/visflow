
"use strict";

var extObject = {

  initialize: function(node, id, type) {

    this.node = node; // parent node

    this.id = id; // port id corresponding to its parent node
    this.type = type; // in-single, in-multiple, out-single, out-multiple

    this.connections = []; // to which other ports it is connected (edges)

    this.data = DataflowData.new(); // stored data
  },

  connect: function(edge) {
    this.connections.push(edge);
  }
};

var DataflowPort = Base.extend(extObject);
