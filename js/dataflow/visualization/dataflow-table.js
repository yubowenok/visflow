
"use strict";

var extObject = {

  plotName: "Table",
  iconClass: "dataflow-table-icon dataflow-square-icon",
  nodeShapeName: "table",

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);

    this.prepare();

    this.keepSize = null;

    this.tableState = null; // last table state
  },

  serialize: function() {
    var result = DataflowTable.base.serialize.call(this);
    result.keepSize = this.keepSize;
    result.tableState = this.table != null ? this.table.state() : null;
    return result;
  },

  deserialize: function(save) {
    DataflowTable.base.deserialize.call(this, save);

    this.tableState = save.tableState;
    this.keepSize = save.keepSize;
  },

  showVisualization: function() {
    var node = this,
        pack = this.ports["in"].pack,
        data = pack.data,
        items = pack.items;

    this.jqvis.addClass("dataflow-table");

    this.checkDataEmpty();
    if (this.isEmpty) {
      this.prepareSvg();
      return;
    }

    if (this.table) {
      this.table.destroy(true);
      this.interactionOn = false;
    }

    var rows = [],
        columns = [];
    columns.push({
      title: "#"
    }); // index column
    for (var i in data.dimensions) { // dimensions
      columns.push({
        title: data.dimensions[i]
      });
    }
    for (var index in items) {
      var row = [index].concat(data.values[index]);
      rows.push(row);
    }
    var jqtable = this.jqtable
      = $("<table class='display'></table>")
      .appendTo(this.jqvis);

    this.table = jqtable
        .DataTable({
          stateSave: true,
          data: rows,
          columns: columns,
          scrollX: true,
          scrollY: "300px",
          info: false
        });
    Utils.blendTableHeader(this.jqview);

    // get thead and tbody selection
    var jqtheadr = jqtable.find("thead");
    this.jqtbody = jqtable.find("tbody");

    var jqwrapper = this.jqvis.find(".dataTables_wrapper"),
        paddedHeight = jqwrapper.height() + 10;

    this.jqview
      .css({
        height: paddedHeight
      })
      .resizable({
        maxWidth: Math.max(jqtheadr.width(), 300),
        maxHeight: paddedHeight
      });

    if (this.keepSize != null) {
      // use previous size regardless of how table entries changed
      this.jqview.css(this.keepSize);
    }

    this.showSelection();
    this.interaction();
  },

  prepareInteraction: function() {

    DataflowTable.base.prepareInteraction.call(this);

    var node = this;

    this.jqtbody
      .mousedown(function(event){
        if (core.interactionManager.ctrled) // ctrl drag mode blocks
          return;
        // block events from elements below
        if(core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      });

    if (!this.ports["in"].pack.isEmpty()){  // avoid selecting "no data" msg
      this.jqtbody.on("click", "tr", function () {
        $(this).toggleClass("selected");
        var jqfirstcol = $(this).find("td:first");
        var index = jqfirstcol.text();

        if (node.selected[index])
          delete node.selected[index];
        else
          node.selected[index] = true;

        node.pushflow();
      });
    }

    this.table.on("draw.dt", function() {
      node.showSelection();
    });
  },

  showSelection: function() {
    var node = this;
    this.jqtable.find("tr").filter(function() {
      var index = $(this).find("td:first").text();
      return node.selected[index] != null;
    })
      .addClass("selected");
  },

  dataChanged: function() {
    // nothing
  },

  selectAll: function() {
    DataflowTable.base.selectAll.call(this);
    this.jqtable.find("tbody tr").addClass("selected");
  },

  clearSelection: function() {
    DataflowTable.base.clearSelection.call(this);
    this.jqtable.find("tr").removeClass("selected");
  },

  resize: function(size) {
    DataflowTable.base.resize.call(this, size);
    this.keepSize = {
      width: this.viewWidth,
      height: this.viewHeight
    };
    //this.showVisualization();
  },

  resizestop: function(size) {
    DataflowTable.base.resizestop.call(this, size);
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
