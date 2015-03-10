
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();

  },

  showIcon: function() {
    this.jqview
      .removeClass("dataflow-table-view");
    this.jqicon = $("<div></div>")
      .addClass("dataflow-table-icon")
      .appendTo(this.jqview);
  },

  showVisualization: function() {
    var pack = this.ports["in"].pack,
        data = pack.data,
        items = pack.items;

    var selected = {};

    if (this.table) {
      this.table.destroy(true);
    }

    this.jqvis.addClass("dataflow-table");

    var jqtable = $("<table></table>")
      .appendTo(this.jqvis);
    $("<thead><tr></tr></thead>")
      .appendTo(jqtable);
    var jqtheadr = jqtable.find("thead tr");
    var jqtbody = $("<tbody></tbody>")
      .appendTo(jqtable);

    if (items.length > 0){  // avoid selecting "no data" msg
      jqtbody.on("click", "tr", function () {
        $(this).toggleClass("selected");
        var id = $(this).find("td:first").text();

        if (selected[id])
          delete selected[id];
        else
          selected[id] = true;
      });
    }

    // make head row
    $("<th>#</th>").appendTo(jqtheadr);  // index column
    for (var i in data.dimensions)  // dimensions
      $("<th>" + data.dimensions[i] + "</th>")
        .appendTo(jqtheadr);

    // make table rows
    for (var i in items) {
      var jqtr = $("<tr></tr>")
        .appendTo(jqtbody);

      // index column
      var index = items[i].index;
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
          scrollY: "300px"
        });
    var jqwrapper = this.jqvis.find(".dataTables_wrapper");

    this.jqview
      .addClass("dataflow-table-view")
      .resizable({
        maxWidth: jqtheadr.width(),
        maxHeight: jqwrapper.height()
      });
  },

  updateVisualization: function() {
  },

  resize: function(size) {
    DataflowTable.base.resize.call(this, size);
  },

  resizestop: function(size) {
    DataflowTable.base.resizestop.call(this, size);
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
