
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

  serialize: function() {
    var result = DataflowTable.base.serialize.call(this);
    return result;
  },

  deserialize: function(save) {
    DataflowTable.base.deserialize.call(this, save);

    if (this.deserializeChange)
      this.show();
  },

  prepareContextMenu: function() {
    DataflowTable.base.prepareContextMenu.call(this);

    this.jqview
      .contextmenu("setEntry", "cut", {title: "Cuty", uiIcon: "ui-icon-heart", disabled: true});
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

    if (this.table)
      this.table.destroy(true);

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
    for (var i in items) {
      var jqtr = $("<tr></tr>")
        .attr("id", i)  // offset in array
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
          scrollY: "300px",
          info: false
        });


    var jqwrapper = this.jqvis.find(".dataTables_wrapper");

    var paddedHeight = jqwrapper.height() + 10;
    this.jqview
      .addClass("dataflow-table-view")
      .css({
        height: paddedHeight
      })
      .resizable({
        maxWidth: jqtheadr.width(),
        maxHeight: paddedHeight
      });
    // as size might be changed, we make a copy to serialize
    this.viewWidth = this.jqview.width();
    this.viewHeight = this.jqview.height();
  },

  interaction: function() {
    var node = this;

    this.jqtbody
      .mousedown(function(event){
        // block events from elements below
        if(core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      });

    if (this.ports["in"].pack.items.length > 0){  // avoid selecting "no data" msg
      this.jqtbody.on("click", "tr", function () {
        $(this).toggleClass("selected");
        var jqfirstcol = $(this).find("td:first");
        var index = jqfirstcol.text();

        if (node.selected[index])
          delete node.selected[index];
        else
          node.selected[index] = jqfirstcol.parent().attr("id");

        node.process();

        core.dataflowManager.propagate(node);
      });
    }

    this.table.on("draw.dt", function() {
      node.showSelection();
    });
  },

  showSelection: function() {
    for (var i in this.selected) {
      this.jqtable.find("tr[id=" + this.selected[i] + "]")
        .addClass("selected");
    }
  },

  updateVisualization: function() {
  },

  process: function() {
    var outpack = this.ports["out"].pack,
        inpack = this.ports["in"].pack;

    // during async data load, selection is first deserialized to vis nodes
    // however the data have not passed in
    // thus the selection might be erronesouly cleared if continue processing
    if (inpack.data.type == "empty")
      return;

    outpack.copy(inpack);

    this.validateSelection();



    var result = [];
    if ($.isEmptyObject(this.selected) == false) {
      // pass selection down
      for (var index in this.selected) {
        // due to async loading, this.selected may get selection before data reaches the node
        if (this.selected[index] >= inpack.items.length) {
          console.log("how come?");
          continue;
        }
        result.push(inpack.items[this.selected[index]]);
      }
    } else {
      // pass nothing down?
    }

    //console.log(result);
    outpack.items = result;
  },

  clearSelection: function() {
    this.selected = {};
    this.jqtable.find("tr").removeClass("selected");
    this.process();
    core.dataflowManager.propagate(this);
  },

  selectAll: function() {
    var inpack = this.ports["in"].pack;
    this.selected = {};
    for (var i in inpack.items) {
      var item = inpack.items[i];
      this.selected[item.index] = i;
    }
    this.jqtable.find("tbody tr").addClass("selected");
    this.process();
    core.dataflowManager.propagate(this);
  },

  resize: function(size) {
    DataflowTable.base.resize.call(this, size);
  },

  resizestop: function(size) {
    DataflowTable.base.resizestop.call(this, size);
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
