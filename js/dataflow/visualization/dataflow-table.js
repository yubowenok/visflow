
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

    this.selected = {};
  },

  serialize: function() {
    var result = DataflowTable.base.serialize.call(this);
    result.selected = this.selected;
    return result;
  },

  deserialize: function(save) {
    DataflowTable.base.deserialize.call(this, save);
    if (save.selected == null)
      save.selected = {};
    this.selected = save.selected;
    if (this.selected instanceof Array) {
      console.error("Array appears as selected!!!");
      this.selected = {};
    }

    if ($.isEmptyObject(this.selected) == false)
      this.deserializeChange = true;

    if (this.deserializeChange) {
      this.show();
    }
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
    }

    this.jqvis.addClass("dataflow-table");

    var jqtable = $("<table></table>")
      .appendTo(this.jqvis);
    $("<thead><tr></tr></thead>")
      .appendTo(jqtable);
    var jqtheadr = jqtable.find("thead tr");

    // table rows, also the interactive region
    var jqtbody = $("<tbody></tbody>")
      .mousedown(function(event){
        // block events from elements below
        if(core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      })
      .appendTo(jqtable);

    if (items.length > 0){  // avoid selecting "no data" msg
      jqtbody.on("click", "tr", function () {
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
          scrollY: "300px"
        });
    var jqwrapper = this.jqvis.find(".dataTables_wrapper");

    this.jqview
      .addClass("dataflow-table-view")
      .resizable({
        maxWidth: jqtheadr.width(),
        maxHeight: jqwrapper.height()
      });
    // as size might be changed, we make a copy to serialize
    this.viewWidth = this.jqview.width();
    this.viewHeight = this.jqview.height();

    // add previously saved selection
    for (var i in this.selected) {
      jqtbody.find("tr[id=" + this.selected[i] + "]")
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

    // some selection items no longer exists in the input
    // we shall remove those selection
    var has = {};
    for (var i in inpack.items) {
      has[inpack.items[i].index] = true;
    }
    for (var index in this.selected) {
      if (has[index] == null){
        delete this.selected[index];
      }
    }

    var result = [];
    for (var index in this.selected) {
      // due to async loading, this.selected may get selection before data reaches the node
      if (this.selected[index] >= inpack.items.length)
        continue;

      result.push(inpack.items[this.selected[index]]);
    }
    //console.log(result);
    outpack.items = result;
  },

  resize: function(size) {
    DataflowTable.base.resize.call(this, size);
  },

  resizestop: function(size) {
    DataflowTable.base.resizestop.call(this, size);
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
