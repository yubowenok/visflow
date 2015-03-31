
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
  defaultPropertiesEdge: {
    "width": 3,
    "color": "#333"
  },
  // show these properties when items are selected
  selectedProperties: {
    "color": "white",
    "border": "#FF4400"
  },
  selectedPropertiesEdge: {
    "color": "#FF4400"
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
    "y2": true,
    "transform": true
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

    // leave some space? TODO
    this.plotMargins = [ { before: 0, after: 0 }, { before: 0, after: 0 } ];

    this.selectedEdges = {};

    // whether to show label, and which dimension is used as label
    this.nodeLabelOn = true;
    this.nodeLabel = null;

    this.panOn = false;

    this.lastDataIdEdges = 0;

    // network translate (transform)
    this.translate = [0, 0];

    this.forceCharge = -10000;
  },

  serialize: function() {
    var result = DataflowNetwork.base.serialize.call(this);
    result.selectedEdges = this.selectedEdges;
    result.lastDataIdEdges = this.lastDataIdEdges;
    result.nodeLabel = this.nodeLabel;
    result.nodeLabelOn = this.nodeLabelOn;
    result.panOn = this.panOn;
    result.forceCharge = this.forceCharge;

    return result;
  },

  deserialize: function(save) {
    DataflowNetwork.base.deserialize.call(this, save);

    this.lastDataIdEdges = save.lastDataIdEdges;
    this.nodeLabel = save.nodeLabel;
    this.nodeLabelOn = save.nodeLabelOn;
    this.panOn = save.panOn;
    this.forceCharge = save.forceCharge;

    if (this.forceCharge == null) {
      this.forceCharge = -10000;
      console.error("forceCharge not saved");
    }
    this.selectedEdges = save.selectedEdges;
    if (this.selectedEdges == null) {
      this.selectedEdges = {};
      console.error("selectedEdges not saved");
    }
  },

  prepareContextmenu: function() {

    DataflowNetwork.base.prepareContextmenu.call(this);

    var node = this;
    // override menu entries
    this.jqview.contextmenu("replaceMenu",
        [
          {title: "Toggle Visualization", cmd: "details", uiIcon: "ui-icon-image"},
          {title: "Toggle Options", cmd: "options", uiIcon: "ui-icon-note"},
          {title: "Toggle Label", cmd: "label"},
          {title: "Visualization Mode", cmd: "vismode"},
          {title: "Panning", cmd: "pan"},
          {title: "Select All", cmd: "selall"},
          {title: "Clear Selection", cmd: "selclear"},
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"}
        ]
    );
  },
  // override select handler
  contextmenuSelect: function(event, ui) {
    if (ui.cmd == "pan"){
      this.togglePan();
    } else {
      // can be handled by base class handler
      DataflowNetwork.base.contextmenuSelect.call(this, event, ui);
    }
  },

  contextmenuBeforeOpen: function(event, ui) {
    if (!this.panOn)
      this.jqview.contextmenu("setEntry", "pan",
        {title: "Panning"});
    else
      this.jqview.contextmenu("setEntry", "pan",
        {title: "Panning", uiIcon: "ui-icon-check"});
    DataflowNetwork.base.contextmenuBeforeOpen.call(this, event, ui);
  },

  prepareInteraction: function() {
    var node = this;
    this.jqsvg.mousedown(function(){
      // always add this view to selection
      if (!core.interactionManager.shifted)
        core.dataflowManager.clearNodeSelection();
      core.dataflowManager.addNodeSelection(node);
    });

    // default select box interaction
    var mode = "none";
    var startPos = [0, 0],
        lastPos = [0, 0],
        endPos = [0, 0];
    var selectbox = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0
    };

    var mouseupHandler = function(event) {
      if (mode == "selectbox") {
        node.selectItemsInBox([
            [selectbox.x1, selectbox.x2],
            [selectbox.y1, selectbox.y2]
          ]);
        if (node.selectbox) {
          node.selectbox.remove();
          node.selectbox = null;
        }
      } else if (mode == "pan") {
        // nothing, already panned
      }
      mode = "none";
      if (core.interactionManager.visualizationBlocking)
        event.stopPropagation();
    };

    this.jqsvg
      .mousedown(function(event) {
        if (core.interactionManager.ctrled) // ctrl drag mode blocks
          return;

        startPos = Utils.getOffset(event, $(this));

        if (event.which == 1) { // left click triggers selectbox
          mode = node.panOn ? "pan" : "selectbox";
        }
        if (core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      })
      .mousemove(function(event) {
        endPos = Utils.getOffset(event, $(this));
        if (mode == "selectbox") {
          selectbox.x1 = Math.min(startPos[0], endPos[0]);
          selectbox.x2 = Math.max(startPos[0], endPos[0]);
          selectbox.y1 = Math.min(startPos[1], endPos[1]);
          selectbox.y2 = Math.max(startPos[1], endPos[1]);
          node.showSelectbox(selectbox);
        } else if (mode == "pan"){
          var dx = endPos[0] - lastPos[0],
              dy = endPos[1] - lastPos[1];
          node.moveNetwork(dx, dy);
        }
        lastPos = endPos;
      })
      .mouseup(mouseupHandler)
      .mouseleave(function(event) {
        mouseupHandler(event);
      });
  },

  moveNetwork: function(dx, dy) {
    this.translate[0] += dx;
    this.translate[1] += dy;
    this.updateVisualization();
  },

  selectItemsInBox: function(box) {
    if (!core.interactionManager.shifted) {
      this.selected = {}; // reset selection if shift key is not down
      this.selectedEdges = {};
    }

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    for (var i in this.nodes) {
      var x = this.nodes[i].x,
          y = this.nodes[i].y; // get current node coordinates
      x += this.translate[0];
      y += this.translate[1];
      if (x >= box[0][0] && x <= box[0][1]
        && y >= box[1][0] && y <= box[1][1]) {
        this.selected[this.nodes[i].dfindex] = true;
      }
    }
    for (var i in this.edges) {
      var x1 = this.edges[i].source.x,
          y1 = this.edges[i].source.y,
          x2 = this.edges[i].target.x,
          y2 = this.edges[i].target.y;
      x1 += this.translate[0];
      y1 += this.translate[1];
      x2 += this.translate[0];
      y2 += this.translate[1];
      if ( (x1 >= box[0][0] && x1 <= box[0][1] && y1 >= box[1][0] && y1 <= box[1][1])
      && (x2 >= box[0][0] && x2 <= box[0][1] && y2 >= box[1][0] && y2 <= box[1][1]) ) {
        this.selectedEdges[this.edges[i].dfindex] = true;
      }
    }
    this.pushflow();
    this.showVisualization(false);
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
    var inpackNodes = this.ports["in"].pack,
        inpackEdges = this.ports["ine"].pack;
    this.clearMessage();
    this.isEmptyNodes = inpackNodes.isEmpty();
    if (inpackNodes.isEmpty() || inpackEdges.isEmpty()) {
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

  showVisualization: function(preventForce) {

    this.checkDataEmpty();
    this.prepareSvg();
    if (this.isEmpty)
      return;
    this.interaction();

    if (this.nodes == null) {
      this.processNetwork();
    }

    var node = this;

    this.svgg = this.svg.append("g")
      .attr("transform", "translate(" + this.translate[0] + "," + this.translate[1] + ")");

    this.svgEdges = this.svgg.selectAll(".df-network-edge")
      .data(this.edgeList).enter().append("line")
      .attr("class", "df-network-edge");

    this.svgArrows = this.svgg.append("g")
      .attr("class", "df-network-arrow")
      .selectAll(".df-network-arrow")
      .data(this.edgeList).enter().append("line");
    this.svgArrows2 = this.svgg.append("g")
      .attr("class", "df-network-arrow")
      .selectAll(".df-network-arrow")
      .data(this.edgeList).enter().append("line");

    this.svgNodes = this.svgg.selectAll(".circle")
      .data(this.nodeList, function(e) { return e.dfindex; }).enter().append("circle")
      .on("dblclick", function(e) {
        d3.select(this).classed("fixed", d.fixed = false);
      });

    var inpackNodes = this.ports["in"].pack,
        nodeData = inpackNodes.data;

    if (this.nodeLabelOn) {
      this.svgLabels = this.svgg.selectAll(".df-network-label")
        .data(this.nodeList).enter().append("text")
        .attr("class", "df-network-label")
        .text(function(e) {
          return node.isEmptyNodes? e.label : nodeData.values[e.dfindex][node.nodeLabel];
        });
    }

    if (!preventForce) {
      this.prepareForce();
      this.force.start();
    }
    this.showSelection();
  },


  updateVisualization: function() {
    // pan
    this.svgg
      .attr("transform", "translate(" + this.translate[0] + "," + this.translate[1] + ")");
    // must use dfindex to avoid conflict with d3 force layout index
    // first update edges
    var items = this.ports["ine"].pack.items,
        ritems = [];
    for (var i in this.edges) {
      var edge = this.edges[i],
          index = edge.dfindex;

      var x1 = edge.source.x, y1 = edge.source.y,
          x2 = edge.target.x, y2 = edge.target.y;
      var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx*dx+dy*dy);
      dx /= len; dy /= len;
      var shift = 3;
      var properties = _.extend(
        {},
        this.defaultPropertiesEdge,
        items[index].properties,
        {
          id: "e" + index,
          dfindex: index,
          x1: x1 - dy * shift,
          y1: y1 + dx * shift,
          x2: x2 - dy * shift,
          y2: y2 + dx * shift
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
      if (edges[i] == null) {
        console.log(edges);
      }
      var properties = edges[i].__data__;
      var u = d3.select(edges[i]);
      this.applyProperties(u, properties, this.propertyTranslateEdge);
    }

    // change arrow direction
    for (var i = 0; i < ritems.length; i++) {
      var properties = ritems[i];
      var x1 = properties.x1, y1 = properties.y1,
          x2 = properties.x2, y2 = properties.y2;
      var dx = x1 - x2, dy = y1 - y2;
      var len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      var size = 18;
      _(properties).extend({
        x1: x2,
        y1: y2,
        x2: x2 + dx * size,
        y2: y2 + dy * size,
        transform: "rotate(10," + x2 + "," + y2 + ")"
      });
    }
    var arrows = this.svgArrows.data(ritems, function(e) { return e.dfindex; })[0];
    for (var i = 0; i < arrows.length; i++) {
      var properties = arrows[i].__data__;
      var u = d3.select(arrows[i]);
      this.applyProperties(u, properties, this.propertyTranslateEdge);
    }
    for (var i = 0; i < ritems.length; i++) {
      var properties = ritems[i];
      _(properties).extend({
        transform: "rotate(-10," + properties.x1 + "," + properties.y1 + ")"
      });
    }
    var arrows2 = this.svgArrows2.data(ritems, function(e) { return e.dfindex; })[0];
    for (var i = 0; i < arrows2.length; i++) {
      var properties = arrows2[i].__data__;
      var u = d3.select(arrows2[i]);
      this.applyProperties(u, properties, this.propertyTranslateEdge);
    }

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
          id: "n" + index,
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

    if (this.nodeLabelOn) {
      // update label positions
      this.svgLabels
        .attr("x", function(e) { return e.x; })
        .attr("y", function(e) { return e.y - 12; });
    }
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;
    // change position of tag to make them appear on top
    for (var index in this.selected) {
      var jqu = this.jqsvg.find("#n" + index)
        .appendTo($(this.svg[0]));
    }
    for (var index in this.selectedEdges) {
      var jqu = this.jqsvg.find("#e" + index)
        .appendTo($(this.svg[0]));
    }
  },


  showOptions: function() {
    var node = this;
    this.checkboxNodeLabel = DataflowCheckbox.new({
      id: "nodelabel",
      label: "Node Labels",
      target: this.jqoptions,
      value: this.nodeLabelOn,
      relative: true,
      change: function(event) {
        console.log(event.unitChange);
        var unitChange = event.unitChange;
        node.nodeLabelOn = unitChange.value;
        node.pushflow();
        node.showVisualization();
      }
    });

    this.selectDimension = DataflowSelect.new({
      id: "dimension",
      label: "Using",
      target: this.jqoptions,
      value: this.nodeLabel,
      list: this.prepareDimensionList(),
      relative: true,
      change: function(event) {
        var unitChange = event.unitChange;
        node.nodeLabel = unitChange.value;
        node.pushflow();
        node.showVisualization();
      }
    });

    this.inputBins = DataflowInput.new({
      id: "charge",
      label: "Charge",
      target: this.jqoptions,
      relative: true,
      accept: "int",
      range: [-200000, 0],
      scrollDelta: 500,
      value: this.forceCharge,
      change: function(event) {
        var unitChange = event.unitChange;
        node.forceCharge = parseInt(unitChange.value);
        node.showVisualization();
      }
    });
  },

  processNodes: function() {
    var inpackNodes = this.ports["in"].pack,
        items = inpackNodes.items,
        data = inpackNodes.data;

    this.nodeList = [];

    // eliminate randomness in initial layout
    var randValue = 3;
    var rand = function() {
      randValue = randValue * 997 + 317;
      randValue %= 1003;
      return randValue;
    };

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
      if (node.x == null)
        node.x = rand();
      if (node.y == null)
        node.y = rand();
      this.nodeList.push(node);
    }
  },

  processEdges: function() {
    var inpack = this.ports["ine"].pack,
        items = inpack.items,
        data = inpack.data;

    this.edgeList = [];

    var skipped = 0;
    for (var index in items) {
      var values = data.values[index];
      var source = this.nodes[values[0]],
          target = this.nodes[values[1]];

      if (source == null || target == null) {
        skipped ++;
        continue; // skip edges without corresponding nodes
      }
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
    //console.log(skipped, "edges skipped");
  },

  validateNetwork: function() {
    var inpackNodes = this.ports["in"].pack,
        inpackEdges = this.ports["ine"].pack;

    var deletedNodes = {};
    var items = inpackNodes.items;
    for (var i in this.nodes) {
      var node = this.nodes[i],
          index = node.dfindex;
      if (items[index] == null) {
        delete this.nodes[i];
        deletedNodes[index] = true;
      }
    }
    var items = inpackEdges.items;
    for (var i in this.edges) {
      var edge = this.edges[i],
          index = edge.dfindex;
      if (items[index] == null
        || deletedNodes[edge.source.dfindex] != null
        || deletedNodes[edge.target.dfindex] != null) {
        delete this.edges[i];
      }
    }
  },

  processNetwork: function() {
    var inpackNodes = this.ports["in"].pack,
        inpackEdges = this.ports["ine"].pack;

    if (inpackEdges.isEmpty() || inpackNodes.isEmpty())
      return;

    if (this.nodes == null) { // never processed
      this.nodes = {};
      this.edges = {};
    }

    this.validateNetwork();
    this.processNodes();
    this.processEdges();

    //console.log("net processed");
  },

  processSelection: function() {
    DataflowNetwork.base.processSelection.call(this); // process node selection
    var inpack = this.ports["ine"].pack,
        outspack = this.ports["outse"].pack;
    outspack.copy(inpack);
    outspack.filter(_.allKeys(this.selectedEdges));
  },

  validateSelection: function() {
    DataflowNetwork.base.validateSelection.call(this); // clear selection of nodes
    var inpackEdges = this.ports["ine"].pack;
    for (var index in this.selectedEdges) { // clear selection of edges
      if (inpackEdges.items[index] == null){
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

    if (this.force != null) {
      this.force.stop();  // prevent further update
    }

    outpackNodes.copy(inpackNodes, true);
    outpackEdges.copy(inpackEdges, true); // always pass through
    outspackNodes.copy(inpackNodes, true);
    outspackNodes.items = {};
    outspackEdges.copy(inpackEdges, true);
    outspackEdges.items = {};

    if (inpackNodes.isEmpty() || inpackEdges.isEmpty()) {
      return;
    }

    this.validateSelection();
    if (this.lastDataId != inpackNodes.data.dataId
      || this.lastDataIdEdges != inpackEdges.data.dataId) {

      this.dataChanged();

      //console.log(inpackNodes);

      this.lastDataId = inpackNodes.data.dataId;
      this.lastDataIdEdges = inpackEdges.data.dataId;
    }
    this.processNetwork();
    this.processSelection();
  },

  prepareForce: function() {
    var node = this;
    if (this.force != null)
      this.force.stop();
    this.force = d3.layout.force()
      .nodes(this.nodeList)
      .links(this.edgeList)
      .size([this.svgSize[0], this.svgSize[1]])
      .charge(this.forceCharge)
      .linkDistance(30)
      .gravity(0.5)
      .friction(0.25)
      .on("tick", function() {
        node.updateVisualization();
      });
    this.force.drag()
      .on("dragstart", function(e) {
        console.log("dd");
        d3.select(this).classed("fixed", d.fixed = true);
      });
  },

  dataChanged: function() {
    this.nodes = {}; // cached positions shall be discarded
    this.edges = {};
    this.nodeLabel = 0;
    this.processNetwork();
  },

  togglePan: function() {
    this.panOn = !this.panOn;
  },

  keyAction: function(key, event) {
    DataflowNetwork.base.keyAction.call(this, key, event);

    if (key == "H")
      this.togglePan();
  },

  selectAll: function() {
    DataflowNetwork.base.selectAll.call(this);
    this.showVisualization();
  },

  clearSelection: function() {
    this.selectedEdges = {};
    DataflowNetwork.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
  },

  resize: function(size) {
    DataflowNetwork.base.resize.call(this, size);
    this.showVisualization();
  }

};

var DataflowNetwork = DataflowVisualization.extend(extObject);
