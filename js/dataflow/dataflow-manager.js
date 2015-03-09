
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
  },
  createNode: function(type) {
    var newnode, dataflowClass;
    switch (type) {

    // data source
    case "datasrc":
    case "intersect":
    case "union":
    case "minus":
    case "range":
    case "contain":
    case "value_maker":
    case "value_extractor":
    case "property_editor":
    case "property_mapping":
      if (type === "datasrc")
        dataflowClass = DataflowDataSource;
      if (type === "intersect")
        dataflowClass = DataflowIntersect;
      if (type === "minus")
        dataflowClass = DataflowMinus;
      if (type === "union")
        dataflowClass = DataflowUnion;
      if (type === "range")
        dataflowClass = DataflowRangeFilter;
      if (type === "contain")
        dataflowClass = DataflowContainFilter;
      if (type === "value_extractor")
        dataflowClass = DataflowValueExtractor;
      if (type === "value_maker")
        dataflowClass = DataflowValueMaker;
      if (type === "property_editor")
        dataflowClass = DataflowPropertyEditor;
      if (type === "property_mapping")
        dataflowClass = DataflowPropertyMapping;
      newnode = dataflowClass.new({
        nodeId: ++this.nodeCounter
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
        nodeId: ++this.nodeCounter,
        visId: ++this.visCounter
      });
      break;
    default:
      console.error("unhandled createNode type", type);
      return;
    }

    var jqview = core.viewManager.createNodeView();
    newnode.setJqview(jqview);
    newnode.show();
    this.nodes[newnode.nodeId] = newnode;
    if (type === "datasrc") {
      this.dataSources.push(newnode);
      newnode.dataId = ++this.dataCounter;
    }
    this.activateNode(newnode.nodeId);
  },

  createEdge: function(sourcePara, targetPara, event) {
    var sourceNode = sourcePara.node,
        targetNode = targetPara.node,
        sourcePort = sourceNode.ports[sourcePara.portId],
        targetPort = targetNode.ports[targetPara.portId];

    var cssparaError = {
      left: event.pageX,
      top: event.pageY
    };

    var con = sourcePort.connectable(targetPort);
    if (con !== 0)  // 0 means okay
      return core.viewManager.tip(con, cssparaError);

    if (this.cycleTest(sourceNode, targetNode))
      return core.viewManager.tip("Cannot make connection that results in cycle", cssparaError);

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
    sourcePort.connect(newedge);
    targetPort.connect(newedge);

    var jqview = core.viewManager.createEdgeView();
    newedge.setJqview(jqview);
    newedge.show();
    this.edges[newedge.edgeid] = newedge;
  },

  deleteNode: function(node) {

    for (var key in node.ports) {
      var port = node.ports[key];
      for (var i in port.connections) {
        this.deleteEdge(connections[i]);
      }
    }
    node.hide();
    core.viewManager.removeNodeView(node.jqview);
    delete this.nodes[node.nodeId];
  },

  deleteEdge: function(edge) {
    // remove the references in port's connection list
    var sourcePort = edge.sourcePort,
        targetPort = edge.targetPort;

    sourcePort.disconnect(edge);
    targetPort.disconnect(edge);

    this.propagate(edge.targetNode);  // not efficient when deleting nodes?

    edge.hide();
    core.viewManager.removeEdgeView(edge.jqview);
    delete this.edges[edge.edgeid];
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
      if (visited[node.nodeId])
        return true;
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
    var topo = [], // visited node list, in reversed topo order
        visited = {};
    var traverse = function(node) {
      if (visited[node.nodeId])
        return;
      visited[node.nodeId] = true;
      topo.push(node);
      for (var i in node.outPorts) {
        var port = node.outPorts[i];
        for (var j in port.connections) {
          traverse(port.connections[j].targetNode);
        }
      }
    };
    traverse(node);
    console.log(topo);
    // iterate in reverse order to obtain topo order
    for (var i = topo.length - 1; i >= 0; i--) {
      topo[i].update();
    }
    for (var i in topo) {
      for (var j in topo[i].outPorts) {
        topo[i].outPorts[j].pack.changed = false;  // unmark changes
      }
    }
  },

  registerData: function(dataId, data) {
    if (dataId == null || data == null)
      return console.error("attempt register null data / null dataId");
    this.data[dataId] = data;
    data.dataId = dataId;
  },

  saveDataflow: function() {
    var jqdialog = $("<div></div>");

    $("<span>Name:</span>")
      .addClass("dataflow-input-leadtext")
      .appendTo(jqdialog);

    $("<input></input>")
      .val("myDataflow")
      .css("width", "80%")
      .appendTo(jqdialog);

    var manager = this;
    jqdialog
      .css("line-height", "50px")
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
    return {
      timestamp: (new Date()).getTime()
    };
  },

  loadSerializedDataflow: function() {

  },

  uploadDataflow: function(filename) {
    $.ajax({
      type: "POST",
      url: "save.php",
      data: {
        filename: filename,
        dataflow: JSON.stringify(this.serializeDataflow())
      },
      success: function(data, textStatus, jqXHR) {
        console.log(data);
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

        jqtbody.on( 'click', 'tr', function () {
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

        jqtable
          .appendTo(jqdialog)
          .DataTable();

        jqdialog
          .dialog({
            title: "Load Dataflow",
            width: 400,
            modal: true,
            buttons: [
              {
                text: "OK",
                click: function() {
                  manager.downloadDataflow(selectedDataflow);
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
    $.ajax({
      type: "POST",
      url: "load.php",
      data: {
        type: "download",
        filename: filename
      },
      success: function(data, textStatus, jqXHR) {
        console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error(jqXHR, textStatus, errorThrown);
      }
    });
  }
};

var DataflowManager = Base.extend(extObject);
