
"use strict";

var extObject = {

  plotName: "Table",
  iconName: "table",

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);

    this.prepare();

    this.keepSize = null;
  },

  serialize: function() {
    var result = DataflowTable.base.serialize.call(this);
    result.keepSize = this.keepSize;
    return result;
  },

  deserialize: function(save) {
    DataflowTable.base.deserialize.call(this, save);
    this.keepSize = save.keepSize;
  },

  showIcon: function() {
    this.jqview
      .removeClass("dataflow-table-view");
    this.jqicon = $("<div></div>")
      .addClass("dataflow-table-icon")
      .appendTo(this.jqview);
  },

  showVisualization: function() {
    var node = this,
        pack = this.ports["in"].pack,
        data = pack.data,
        items = pack.items;

    if (this.table) {
      this.table.destroy(true);
      this.interactionOn = false;
    }

    this.jqvis.addClass("dataflow-table");

    var jqtable = $("<table></table>")
      .appendTo(this.jqvis);
    $("<thead><tr></tr></thead>")
      .appendTo(jqtable);
    var jqtheadr = jqtable.find("thead tr");

    // table rows, also the interactive region
    var jqtbody = this.jqtbody = $("<tbody></tbody>")
      .appendTo(jqtable);

    // make head row
    $("<th>#</th>").appendTo(jqtheadr);  // index column
    for (var i in data.dimensions)  // dimensions
      $("<th>" + data.dimensions[i] + "</th>")
        .appendTo(jqtheadr);

    // make table rows
    for (var index in items) {
      var jqtr = $("<tr></tr>")
        .attr("id", "i" + index)
        .appendTo(jqtbody);
      // index column
      $("<td>" + index + "</td>")
        .appendTo(jqtr);
      // values
      for (var j in data.dimensions) {
        var value = data.values[index][j];
        $("<td>" + value + "</td>")
          .appendTo(jqtr);
      }
    }

    var toolbarHeight = 0;

    this.jqtable = jqtable;

    this.table = jqtable
        .DataTable({
          scrollX: true,
          scrollY: "300px",
          info: false
        });

    var jqwrapper = this.jqvis.find(".dataTables_wrapper");

    var paddedHeight = jqwrapper.height() + 10;

    this.jqview
      .css({
        height: paddedHeight
      })
      .resizable({
        maxWidth: jqtheadr.width(),
        maxHeight: paddedHeight
      });

    // otherwise size is not quite correct when empty
    if (!this.isEmpty)
      this.jqview.addClass("dataflow-table-view");

    if (this.keepSize != null) {
      // use previous size regardless of how table entries changed
      this.jqview.css(this.keepSize);
    }

    // update ports
    this.viewWidth = this.jqview.width();
    this.viewHeight = this.jqview.height();
    this.updatePorts();
    this.showSelection();

    if (this.isEmpty) // do not interact if data is empty
      return;
    this.interaction();
  },

  prepareInteraction: function() {
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
    if (this.ports["in"].pack.isEmpty())
      return;

    for (var index in this.selected) {
      this.jqtable.find("tr[id=i" + index + "]")
        .addClass("selected");
    }
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
  },

  resizestop: function(size) {
    DataflowTable.base.resizestop.call(this, size);
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
