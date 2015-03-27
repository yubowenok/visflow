
/*
 *
 * DataflowManager handles all operations related to dataflow graph
 * Currently, we assume only one graph is being editted at any time
 * So the dataflow manager equivalently represent the graph itself
 *
 */

"use strict";

var extObject = {
  initialize: function() {
    this.resetDataflow();
    this.lastFilename = "myDataflow";
  },

  resetDataflow: function() {
    // counters start from 1
    this.nodeCounter = 0;
    this.visCounter = 0;
    this.edgeCounter = 0;
    this.dataCounter = 0;

    this.dataSources = [];

    this.nodes = {};
    this.edges = {};

    // the whole data collection
    // each id refers to a data object
    this.data = {};

    this.nodesSelected = {};
    this.nodesHovered = {};

    this.edgeSelected = null;

    this.propagateDisabled = false;

    this.asyncDataloadCount = 0;
    this.asyncDataloadQueue = [];

    this.visModeOn = false;
  },

  createNode: function(type) {

    var newnode, dataflowClass;
    var para = {};
    switch (type) {
    // data source
    case "datasrc":
    case "intersect":
    case "union":
    case "minus":
    case "range":
    case "contain":
    case "value-maker":
    case "value-extractor":
    case "property-editor":
    case "property-mapping":
      if (type == "datasrc")
        dataflowClass = DataflowDataSource;
      if (type == "intersect")
        dataflowClass = DataflowIntersect;
      if (type == "minus")
        dataflowClass = DataflowMinus;
      if (type == "union")
        dataflowClass = DataflowUnion;
      if (type == "range")
        dataflowClass = DataflowRangeFilter;
      if (type == "contain")
        dataflowClass = DataflowContainFilter;
      if (type == "value-extractor")
        dataflowClass = DataflowValueExtractor;
      if (type == "value-maker")
        dataflowClass = DataflowValueMaker;
      if (type == "property-editor")
        dataflowClass = DataflowPropertyEditor;
      if (type == "property-mapping")
        dataflowClass = DataflowPropertyMapping;
      break;

    // visualizations
    case "table":
    case "scatterplot":
    case "parallelcoordinates":
    case "histogram":
    case "heatmap":
      if (type == "table")
        dataflowClass = DataflowTable;
      if (type == "scatterplot")
        dataflowClass = DataflowScatterplot;
      if (type == "parallelcoordinates")
        dataflowClass = DataflowParallelCoordinates;
      if (type == "histogram")
        dataflowClass = DataflowHistogram;
      if (type == "heatmap")
        dataflowClass = DataflowHeatmap;
      _(para).extend({
        visId: ++this.visCounter,
      });
      break;
    default:
      console.error("unhandled createNode type", type);
      return;
    }
    _(para).extend({
      nodeId: ++this.nodeCounter,
      type: type
    });
    newnode = dataflowClass.new(para);
    var jqview = core.viewManager.createNodeView();
    newnode.setJqview(jqview);
    newnode.show();
    this.nodes[newnode.nodeId] = newnode;
    if (type == "datasrc" || type == "value-maker") {
      this.dataSources.push(newnode);
    }
    this.activateNode(newnode.nodeId);

    // select newnode (exclusive) after
    this.clearNodeSelection();
    this.addNodeSelection(newnode);
    return newnode;
  },

  createEdge: function(sourcePort, targetPort) {
    var sourceNode = sourcePort.node,
        targetNode = targetPort.node;

    var con = sourcePort.connectable(targetPort);

    if (con !== 0)  // 0 means okay
      return core.viewManager.tip(con), -1;

    var newedge = DataflowEdge.new({
      edgeId: ++this.edgeCounter,
      sourceNode: sourceNode,
      sourcePort: sourcePort,
      targetNode: targetNode,
      targetPort: targetPort
    });
    var jqview = core.viewManager.createEdgeView();
    newedge.setJqview(jqview);
    newedge.show();

    sourcePort.connect(newedge);
    targetPort.connect(newedge);

    this.edges[newedge.edgeId] = newedge;
    return newedge;
  },

  deleteNode: function(node) {
    for (var key in node.ports) {
      var port = node.ports[key];
      var connections = port.connections.slice();
      // cannot use port.connections, because the length is changing
      for (var i in connections) {
        this.deleteEdge(connections[i]);
      }
    }
    node.remove();  // removes the jqview
    delete this.nodes[node.nodeId];
  },

  deleteEdge: function(edge) {
    // remove the references in port's connection list
    var sourcePort = edge.sourcePort,
        targetPort = edge.targetPort;

    sourcePort.disconnect(edge);
    targetPort.disconnect(edge);

    this.propagate(edge.targetNode);  // not efficient when deleting nodes?

    edge.remove();  // removes the jqview
    delete this.edges[edge.edgeId];
  },

  activateNode: function(nodeId) {
    if (this.nodes[nodeId].jqview == null)
      console.error("node does not have jqview");
    core.viewManager.bringFrontView(this.nodes[nodeId].jqview);
  },

  // check if connecting source to target will result in cycle
  cycleTest: function(sourceNode, targetNode) {
    var visited = {};
    visited[sourceNode.nodeId] = true;
    // traverse graph to find cycle
    var traverse = function(node) {
      if (node.nodeId == sourceNode.nodeId)
        return true;
      if (visited[node.nodeId])
        return false;
      visited[node.nodeId] = true;
      for (var i in node.outPorts) {
        var port = node.outPorts[i];
        for (var j in port.connections) {
          if (traverse(port.connections[j].targetNode))
            return true;
        }
      }
      return false;
    };
    return traverse(targetNode);
  },

  // propagate result starting from a given node
  propagate: function(node) {

    if (this.propagateDisabled)
      return;

    var topo = [], // visited node list, in reversed topo order
        visited = {};
    var traverse = function(node) {
      if (visited[node.nodeId])
        return;
      visited[node.nodeId] = true;
      for (var i in node.outPorts) {
        var port = node.outPorts[i];
        for (var j in port.connections) {
          traverse(port.connections[j].targetNode);
        }
      }
      topo.push(node);
    };
    if (DataflowNode.isPrototypeOf(node)) {
      traverse(node);
    } else if (node instanceof Array) {
      for (var i in node) {
        traverse(node[i]);
      }
    }
    // iterate in reverse order to obtain topo order
    // skip the first one (the node itself)
    for (var i = topo.length - 1; i >= 0; i--) {
      topo[i].update();
    }
    for (var i in topo) {
      for (var j in topo[i].ports) {  // include both in and out
        topo[i].ports[j].pack.changed = false;  // unmark changes
      }
    }
  },

  registerData: function(data) {
    if (data == null || data.type == "empty")
      return console.error("attempt register null/empty data");
    this.data[++this.dataCounter] = data;
    data.dataId = this.dataCounter;
  },

  saveDataflow: function() {
    var jqdialog = $("<div></div>");

    $("<span>Name:</span>")
      .addClass("dataflow-input-leadtext")
      .appendTo(jqdialog);

    $("<input></input>")
      .val(this.lastFilename)
      .attr("maxlength", 30)
      .css("width", "80%")
      .appendTo(jqdialog);

    var manager = this;
    jqdialog
      .css("padding", "20px")
      .dialog({
        title: "Save Dataflow",
        modal: true,
        buttons: [
          {
            text: "OK",
            click: function() {
              var filename = $(this).find("input").val();
              manager.uploadDataflow(filename);
              $(this).dialog("close");
            }
          }
        ]
      });
  },

  // this function parses the current dataflow and
  // returns a standard dataflow configuration object
  serializeDataflow: function() {
    var result = {
      timestamp: (new Date()).getTime(),
      nodes: [],
      edges: []
    };
    for (var i in this.nodes) {
      result.nodes.push(this.nodes[i].serialize());
    }
    for (var i in this.edges) {
      result.edges.push(this.edges[i].serialize());
    }
    console.log(result);
    return result;
  },

  deserializeDataflow: function(dataflow) {
    this.clearDataflow();

    this.propagateDisabled = true;  // temporarily switch off propagation

    var hashes = {};

    for (var i in dataflow.nodes) {
      var nodeSaved = dataflow.nodes[i];
      var type = nodeSaved.type;

      for (var j in type) {
        if (type[j] == "_") {
          type = type.replace(/_/g, "-");
          console.error("fix old type with underscore");
          break;
        }
      }

      var newnode = this.createNode(type);
      hashes[nodeSaved.hashtag] = newnode;
      //newnode.jqview.css(nodeSaved.css);

      newnode.deserialize(nodeSaved);
      newnode.loadCss();
    }
    for (var i in dataflow.edges) {
      var edgeSaved = dataflow.edges[i];
      var sourceNode = hashes[edgeSaved.sourceNodeHash],
          targetNode = hashes[edgeSaved.targetNodeHash],
          sourcePort = sourceNode.ports[edgeSaved.sourcePortId],
          targetPort = targetNode.ports[edgeSaved.targetPortId];

      if (targetPort == null) {
        console.error("older version set nodes detected");
        targetPort = targetNode.ports["in"];
      }
      this.createEdge(sourcePort, targetPort);
    }

    this.propagateDisabled = false; // full propagation
    this.propagate(this.dataSources);
  },

  previewVisMode: function(on) {
    if (on) {
      for (var i in this.edges) {
        var edge = this.edges[i];
        edge.jqview.css("opacity", 0.2);
      }
      for (var i in this.nodes){
        var node = this.nodes[i];
        if (!node.visModeOn) {
          node.jqview.css("opacity", 0.2);
        }
      }
    } else {
      for (var i in this.edges) {
        var edge = this.edges[i];
        edge.jqview.css("opacity", "");
      }
      for (var i in this.nodes){
        var node = this.nodes[i];
        node.jqview.css("opacity", "");
        node.show();
      }
    }
  },

  toggleVisMode: function() {
    // first save the current configuration
    for (var i in this.nodes){
      var node = this.nodes[i];
      node.saveCss();
    }
    // then toggle the mode, otherwise saveCss will overwrite wrong settings
    this.visModeOn = !this.visModeOn;

    if (this.visModeOn) {
      for (var i in this.edges)
        this.edges[i].hide();
      for (var i in this.nodes)
        this.nodes[i].hide();
      for (var i in this.nodes){
        this.nodes[i].show();
        this.nodes[i].loadCss();
      }
    } else {
      for (var i in this.edges)
        this.edges[i].show();
      for (var i in this.nodes) {
        this.nodes[i].loadCss();
        this.nodes[i].show();
      }
    }
  },

  clearDataflow: function() {
    // clear screen
    core.viewManager.clearDataflowViews();
    this.resetDataflow();
  },

  uploadDataflow: function(filename) {
    this.lastFilename = filename;
    $.ajax({
      type: "POST",
      url: "save.php",
      data: {
        filename: filename,
        dataflow: JSON.stringify(this.serializeDataflow())
      },
      success: function(data, textStatus, jqXHR) {
        var dialog = $("<div></div>")
          .css("padding", "20px");
        var ok = data.status == "success";
        var successMsg = "Dataflow uploaded to the server (" + data.filename + ")",
            errorMsg = "Failed to save dataflow. " + data.msg;
        dialog
          .text(ok ? successMsg : errorMsg)
          .dialog({
            modal: true,
            title: ok ? "Dataflow Saved" : "Save Error",
            buttons: {
              OK: function() {
                $(this).dialog("close");
              }
            }
          });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR, textStatus, errorThrown);
      }
    });
  },

  loadDataflow: function() {
    var manager = this;
    $.ajax({
      type: "POST",
      url: "load.php",
      data: {
        type: "filelist"
      },
      success: function(data, textStatus, jqXHR) {
        var filelist = data.filelist;
        var jqdialog = $("<div></div>");
        var jqtable = $("<table></table>")
          .appendTo(jqdialog);
        $("<thead><th>Name</th><th>Last Modified</th></thead>")
          .appendTo(jqtable);
        var jqtbody = $("<tbody></tbody>")
          .appendTo(jqtable);

        var selectedDataflow = null;

        jqtbody.on("click", "tr", function () {
          $(this).parent().find("tr").removeClass("selected");
          $(this).toggleClass('selected');
          selectedDataflow = $(this).find("td:first").text();

          // enable OK button as one item is now selected
          jqdialog.parent().find("button:contains('OK')")
            .prop("disabled", false)
            .removeClass("ui-state-disabled");
        });

        for (var i in filelist) {
          var file = filelist[i];
          $("<tr>" +
            "<td>" + file.filename + "</td>" +
            "<td>" + (new Date(file.mtime)).toLocaleString() + "</td>" +
            "</tr>")
            .appendTo(jqtbody);
        }

        var table = jqtable
          .appendTo(jqdialog)
          .DataTable();
        Utils.blendTableHeader(jqtable.parent());

        jqdialog
          .dialog({
            title: "Load Dataflow",
            width: 400,
            modal: true,
            buttons: [
              {
                text: "OK",
                click: function() {
                  // now open a new page (for logging)
                  window.open("index.php?filename=" + selectedDataflow, "_self");
                  //manager.downloadDataflow(selectedDataflow);
                  table.destroy(true);
                  $(this).dialog("close");
                }
              }
            ]
          });
        // disable OK button as no item is selected
        jqdialog.parent().find("button:contains('OK')")
          .prop("disabled", true)
          .addClass("ui-state-disabled");
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR, textStatus, errorThrown);
      }
    });
  },

  downloadDataflow: function(filename) {
    this.lastFilename = filename;

    var manager = this;
    $.ajax({
      type: "POST",
      url: "load.php",
      data: {
        type: "download",
        filename: filename
      },
      success: function(data, textStatus, jqXHR) {
        if (data.status != "success") {
          $("<div></div>")
          .text("Failed to download dataflow. " + data.msg)
          .css("padding", "20px")
          .dialog({
            modal: true,
            title: "Load Error",
            buttons: {
              OK: function() {
                $(this).dialog("close");
              }
            }
          });
          return;
        }
        manager.deserializeDataflow(data.dataflow);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR, textStatus, errorThrown);
      }
    });
  },

  addEdgeSelection: function(edge) {
    // can only select a single edge at a time by hovering
    this.edgeSelected = edge;
  },

  clearEdgeSelection: function() {
    this.edgeSelected = null;
  },

  addNodeSelection: function(nodes) {
    var toAdd = {};
    if (nodes instanceof Array) {
      for (var i in nodes) {
        toAdd[nodes[i].nodeId] = nodes[i];
      }
    } else if (DataflowNode.isPrototypeOf(nodes)){
      toAdd[nodes.nodeId] = nodes;
    } else {
      toAdd = nodes;
    }
    for (var i in toAdd) {
      var node = toAdd[i];
      this.nodesSelected[node.nodeId] = node;
      node.jqview.addClass("dataflow-node-selected");
    }
  },

  clearNodeSelection: function(nodes) {
    var toClear = {};
    if (nodes == null) {
      toClear = this.nodesSelected;
    } else if (nodes instanceof Array) {
      for (var i in nodes) {
        var node = nodes[i];
        toClear[node.nodeId] = node;
      }
    } else {
      toClear[nodes.nodeId] = nodes;
    }
    for (var i in toClear) {
      var node = toClear[i];
      node.jqview.removeClass("dataflow-node-selected");
      delete this.nodesSelected[node.nodeId];
    }
  },

  addNodeHover: function(nodes) {
    var toAdd = {};
    if (nodes instanceof Array) {
      for (var i in nodes) {
        toAdd[nodes[i].nodeId] = nodes[i];
      }
    } else if (DataflowNode.isPrototypeOf(nodes)){
      toAdd[nodes.nodeId] = nodes;
    } else {
      toAdd = nodes;
    }
    for (var i in toAdd) {
      var node = toAdd[i];
      node.jqview.addClass("dataflow-node-hover");
      this.nodesHovered[node.nodeId] = node;
    }
  },

  clearNodeHover: function(nodes) {
    var toClear = {};
    if (nodes == null) {
      toClear = this.nodesHovered;
    } else if (nodes instanceof Array) {
      for (var i in nodes) {
        var node = nodes[i];
        toClear[node.nodeId] = node;
      }
    } else {
      toClear[nodes.nodeId] = nodes;
    }
    for (var i in toClear) {
      var node = toClear[i];
      node.jqview.removeClass("dataflow-node-hover");
      delete this.nodesHovered[node.nodeId];
    }
  },

  getNodesInSelectbox: function(selectbox) {
    var result = [];
    for (var i in this.nodes) {
      var jqview = this.nodes[i].jqview;
      var box1 = {
        width: jqview.width(),
        height: jqview.height(),
        left: jqview.position().left,
        top: jqview.position().top
      };
      if (core.viewManager.intersectBox(box1, selectbox)) {
        result.push(this.nodes[i]);
      }
    }
    return result;
  },

  addHoveredToSelection: function() {
    this.addNodeSelection(this.nodesHovered);
    this.clearNodeHover();
  },

  moveNodes: function(dx, dy, nodes) {
    for (var i in nodes) {
      var node = nodes[i];
      var x = node.jqview.position().left,
          y = node.jqview.position().top;
      node.jqview.css({
        left: x + dx,
        top: y + dy
      });
      node.updatePorts();
    }
  },

  isNodeSelected: function(node) {
    return this.nodesSelected[node.nodeId] != null;
  },

  // pass key actions to selected nodes & edge
  keyAction: function(key, event) {

    if (key == "ctrl+S") {
      this.saveDataflow();
      event.preventDefault();
    }
    else if (key == "ctrl+L") {
      this.loadDataflow();
      event.preventDefault();
    }
    else {
      if (this.edgeSelected == null) { // edge and node selection are exclusive
        for (var nodeId in this.nodesSelected) {
          var node = this.nodesSelected[nodeId];
          node.keyAction(key, event);
        }
      } else {
        this.edgeSelected.keyAction(key, event);
      }
    }
  },

  // prevent rushing in loading
  asyncDataloadStart: function(node) {
    this.asyncDataloadCount ++;
    this.asyncDataloadQueue.push(node);
  },

  asyncDataloadEnd: function() {
    this.asyncDataloadCount --;
    if (this.asyncDataloadCount == 0) {
      this.propagate(this.asyncDataloadQueue);
      this.asyncDataloadQueue = [];
    }
  }
};

var DataflowManager = Base.extend(extObject);
