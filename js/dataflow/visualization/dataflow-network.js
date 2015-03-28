
"use strict";

var extObject = {

  plotName: "Network",
  iconClass: "dataflow-network-icon dataflow-square-icon",

  // use object to specify default rendering properties
  defaultProperties: {
    "color": "#555",
    "border": "black",
    "width": 2,
    "size" : 5
  },
  defaultPropertiesEdges: {

  },
  // show these properties when items are selected
  selectedProperties: {
    "color": "white",
    "border": "#FF4400"
  },
  selectedPropertiesEdge: {
  },
  // create highlight effect for selected, using multiplier
  selectedMultiplier: {
    "size": 1.2,
    "width": 1.2
  },
  selectedMultiplierEdge: {

  },
  // let d3 know to use attr or style for each key
  isAttr: {
    "r": true,
    "cx": true,
    "cy": true,
    "x1": true,
    "x2": true,
    "y1": true,
    "y2": true
  },
  // translate what user see to css property
  propertyTranslate: {
    "size": "r",
    "color": "fill",
    "border": "stroke",
    "width": "stroke-width"
  },
  propertyTranslateEdge: {
    "size": "r",
    "color": "stroke",
    "width": "stroke-width",
    "border": "ignore"
  },

  initialize: function(para) {
    DataflowNetwork.base.initialize.call(this, para);

    // network has special in/out
    this.inPorts = [
      DataflowPort.new(this, "in", "in-single", "D"),
      DataflowPort.new(this, "ine", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "outs", "out-multiple", "S"),
      DataflowPort.new(this, "outse", "out-multiple", "S"),
      DataflowPort.new(this, "out", "out-multiple", "D"),
      DataflowPort.new(this, "oute", "out-multiple", "D")
    ];

    this.prepare();

    // re-processed from edge list table
    this.nodeList = [];
    this.edgeList = [];
    this.nodes = null;  // refer to node objects
    this.edges = null;  // refer to edge objects

    // leave some space for axes
    this.plotMargins = [ { before: 0, after: 0 }, { before: 0, after: 0 } ];

    this.selectedEdges = {};

    this.nodeLabel = 0;

    this.lastDataIdEdges = 0;
  },

  serialize: function() {
    var result = DataflowNetwork.base.serialize.call(this);
    result.selectedEdges = this.selectedEdges;
    result.lastDataIdEdges = this.lastDataIdEdges;
    result.nodeLabel = this.nodeLabel;
    return result;
  },

  deserialize: function(save) {
    DataflowNetwork.base.deserialize.call(this, save);

    this.lastDataIdEdges = save.lastDataIdEdges;
    this.nodeLabel = save.nodeLabel;

    this.selectedEdges = save.selectedEdges;
    if (this.selectedEdges == null) {
      this.selectedEdges = {};
      console.error("selectedEdges not saved");
    }
  },



  selectItemsInBox: function(box) {
    if (!core.interactionManager.shifted) {
      this.selected = {}; // reset selection if shift key is not down
    }

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;
        /*
    for (var index in items) {
      var ok = 1;
      [0, 1].map(function(d) {
        var value = values[index][this.dimensions[d]];
        value = this.dataScales[d](value);
        value = this.screenScales[d](value);
        if (value < box[d][0] || value > box[d][1]) {
          ok = 0;
        }
      }, this);

      if (ok) {
        this.selected[index] = true;
      }
    }
    */

    this.showVisualization();
    this.pushflow();
  },

  showSelectbox: function(box) {
    var node = this;
    this.selectbox = this.svg.select(".df-vis-selectbox");
    if (this.selectbox.empty())
      this.selectbox = this.svg.append("rect")
        .attr("class", "df-vis-selectbox");

    this.selectbox
      .attr("x", box.x1)
      .attr("y", box.y1)
      .attr("width", box.x2 - box.x1)
      .attr("height", box.y2 - box.y1);
  },

  checkDataEmpty: function() {
    this.clearMessage();
    this.isEmptyNodes = this.ports["in"].pack.isEmpty();
    if (this.ports["ine"].pack.isEmpty()) {
      // otherwise scales may be undefined
      this.showMessage("empty data in " + this.plotName);
      this.isEmpty = true;

      if (this.svg) {
        this.svg.remove();
        this.interactionOn = false;
      }
      return;
    }
    this.isEmpty = false;
  },

  showVisualization: function() {

    this.checkDataEmpty();
    this.prepareSvg();
    if (this.isEmpty)
      return;
    this.interaction();

    if (this.nodes == null) {
      this.processNetwork();
    }

    var node = this;

    this.svgEdges = this.svg.selectAll(".df-network-edge")
      .data(this.edgeList).enter().append("line")
      .attr("class", "df-network-edge");

    this.svgNodes = this.svg.selectAll(".circle")
      .data(this.nodeList).enter().append("circle")
      .on("dblclick", function(e) {
        d3.select(this).classed("fixed", d.fixed = false);
      });

    var inpackNodes = this.ports["in"].pack,
        nodeData = inpackNodes.data;

    this.svgLabels = this.svg.selectAll(".df-network-label")
      .data(this.nodeList).enter().append("text")
      .text(function(e) {
        return node.isEmptyNodes? e.label : nodeData.values[e.dfindex][node.nodeLabel];
      });

    var drag = this.force.drag()
      .on("dragstart", function(e) {
        d3.select(this).classed("fixed", d.fixed = true);
      });

    this.force.start();

    this.showSelection();
  },


  updateVisualization: function() {
    // must use dfindex to avoid conflict with d3 force layout index

    // first update edges
    var items = this.ports["ine"].pack.items,
        ritems = [];
    for (var i in this.edges) {
      var edge = this.edges[i],
          index = edge.dfindex;
      var properties = _.extend(
        {},
        this.defaultPropertiesEdge,
        items[index].properties,
        {
          dfindex: index,
          x1: edge.source.x,
          y1: edge.source.y,
          x2: edge.target.x,
          y2: edge.target.y
        }
      );
      if (this.selectedEdges[index]) {
        _(properties).extend(this.selectedPropertiesEdge);
        this.multiplyProperties(properties, this.selectedMultiplierEdge);
      }
      ritems.push(properties);
    }

    var edges = this.svgEdges.data(ritems, function(e) { return e.dfindex; })[0];
    for (var i = 0; i < edges.length; i++) {
      var properties = edges[i].__data__;
      var u = d3.select(edges[i]);
      this.applyProperties(u, properties, this.propertyTranslateEdge);
    }

    if (!this.isEmptyNodes) {
      var ritems = [];
      var items = this.ports["in"].pack.items;
      for (var i in this.nodes) {
        var node = this.nodes[i],
            index = node.dfindex;
        var properties = _.extend(
          {},
          this.defaultProperties,
          items[index].properties,
          {
            dfindex: index,
            cx: node.x,
            cy: node.y
          }
        );
        if (this.selected[index]) {
          _(properties).extend(this.selectedProperties);
          this.multiplyProperties(properties, this.selectedMultiplier);
        }
        ritems.push(properties);
      }
      var nodes = this.svgNodes.data(ritems, function(e) { return e.dfindex; })[0];
      for (var i = 0; i < nodes.length; i++) {
        var properties = nodes[i].__data__;
        var u = d3.select(nodes[i]);
        this.applyProperties(u, properties, this.propertyTranslate);
      }

    } else {
      // no node data input, simply update positions
      this.svgNodes
        .attr("cx", function(e) { return e.x; })
        .attr("cy", function(e) { return e.y; });
    }

    // update label positions
    this.svgLabels
      .attr("x", function(e) { return e.x + 10; })
      .attr("y", function(e) { return e.y; });
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;
    // change position of tag to make them appear on top
    for (var index in this.selected) {
      var jqu = this.jqsvg.find("#i" + index)
        .appendTo($(this.svgPoints[0]));
    }
  },


  showOptions: function() {
    var node = this;
  },

  showAxis: function() {
  },

  processNodesFromEdges: function() {
    var inpackEdges = this.ports["ine"].pack,
        items = inpackEdges.items,
        data = inpackEdges.data;
    var nodeNames = {};
    // update without changing nodes positions
    for (var index in items) {
      var values = data.values[index];
      // TODO, temporarily assuming dimensions
      var source = values[0], target = values[1];
      nodeNames[source] = true;
      nodeNames[target] = true;
    }
    var counter = 0;
    for (var name in nodeNames) {
      var node = this.nodes[name];
      if (node == null) {
        // create an empty object for new node
        node = this.nodes[name] = {};
      }
      _(node).extend({
        dfindex: counter++,
        label: name
      });
      this.nodeList.push(node);
    }
  },

  processNodes: function() {
    var inpackNodes = this.ports["in"].pack,
        items = inpackNodes.items,
        data = inpackNodes.data;
    for (var index in items) {
     var values = data.values[index];
      // TODO, temporarily assuming name is first column
      var name = values[0];
      var node = this.nodes[name];
      if (node == null) {
        // create an empty object for new node
        node = this.nodes[name] = {};
      }
      _(node).extend({
        dfindex: index
      });
      this.nodeList.push(node);
    }
  },

  processEdges: function() {
   var inpack = this.ports["ine"].pack,
        items = inpack.items,
        data = inpack.data;
    for (var index in items) {
      var values = data.values[index];
      var source = this.nodes[values[0]],
          target = this.nodes[values[1]];

      if (source == null || target == null)
        continue; // skip edges without corresponding nodes
      var edge = this.edges[index];
      if (edge == null) {
        // create an empty object for new edge
        edge = this.edges[index] = {};
      }
      _(edge).extend({
        dfindex: index,
        source: source,
        target: target,
        dfweight: values[2] // TODO, hacky
      });
      this.edgeList.push(edge);
    }
  },

  processNetwork: function() {
    this.nodeList = [];
    this.edgeList = [];

    var inpackNodes = this.ports["in"].pack,
        inpackEdges = this.ports["ine"].pack;

    if (inpackEdges.isEmpty())
      return;

    if (this.nodes == null) { // never processed
      this.nodes = {};
      this.edges = {};
    }

    if (inpackNodes.isEmpty()) {
      this.processNodesFromEdges();
    } else {
      this.processNodes();
    }
    this.processEdges();
    console.log("net processed");

    console.log(this.nodeList, this.edgeList);
    this.prepareForce();
  },

  validateSelection: function() {
    DataflowNetwork.base.validateSelection.call(this); // clear selection of nodes
    var inpackEdges = this.ports["ine"].pack;
    for (var index in this.selectedEdges) { // clear selection of edges
      if (inpack.items[index] == null){
        delete this.selectedEdges[index];
      }
    }
  },

  process: function() {
    var inpackNodes = this.ports["in"].pack,
        inpackEdges = this.ports["ine"].pack,
        outpackNodes = this.ports["out"].pack,
        outpackEdges = this.ports["oute"].pack,
        outspackNodes = this.ports["outs"].pack,
        outspackEdges = this.ports["outse"].pack;

    outpackNodes.copy(inpackNodes, true);
    outpackEdges.copy(inpackEdges, true); // always pass through
    outspackNodes.copy(inpackNodes, true);
    outspackNodes.items = {};
    outspackEdges.copy(inpackEdges, true);
    outspackEdges.items = {};

    if (inpackEdges.isEmpty()) {
      return;
    }
    this.validateSelection();
    if (this.lastDataId != inpackNodes.data.dataId
      || this.lastDataIdEdges != inpackEdges.data.dataId) {

      this.dataChanged();

      console.log(inpackNodes);

      this.lastDataId = inpackNodes.data.dataId;
      this.lastDataIdEdges = inpackEdges.data.dataId;
    }
    this.processSelection();
  },

  prepareForce: function() {
    var node = this;
    this.force = d3.layout.force()
      .nodes(this.nodeList)
      .links(this.edgeList)
      .size([this.svgSize[0], this.svgSize[1]])
      .charge(-10000)
      .linkDistance(40)
      .gravity(1.0)
      .friction(0.6)
      .on("tick", function() {
        node.updateVisualization();
      });
  },

  dataChanged: function() {
    this.nodes = {}; // cached positions shall be discarded
    this.edges = {};
    this.nodeLabel = 0;
    this.processNetwork();
  },

  selectAll: function() {
    DataflowNetwork.base.selectAll.call(this);
    this.showVisualization();
  },

  clearSelection: function() {
    DataflowNetwork.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
  },

  resize: function(size) {
    DataflowNetwork.base.resize.call(this, size);
    this.showVisualization();
  }

};

var DataflowNetwork = DataflowVisualization.extend(extObject);
