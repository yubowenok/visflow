
"use strict";

var extObject = {

  iconClass: "dataflow-datasrc-icon dataflow-square-icon",
  nodeShapeName: "normal",

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowDataSource.base.initialize.call(this, para);

    this.dataSelected = "none"; // data identifier string
    this.dataName = null; // full data name, for human read

    this.inPorts = [];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];
    this.prepare();
  },

  serialize: function() {
    var result = DataflowDataSource.base.serialize.call(this);
    result.dataSelected = this.dataSelected;
    result.dataName = this.dataName;
    return result;
  },

  deserialize: function(save) {
    DataflowDataSource.base.deserialize.call(this, save);
    if (save.dataSelected != "none") {
      this.loadData(save.dataSelected, save.dataName);
    }
  },

  show: function() {
    DataflowDataSource.base.show.call(this); // call parent settings

    var jqview = this.jqview,
        node = this;

    if (this.detailsOn) {
      this.jqview
        .css("text-align", "center");

      $("<div style='padding: 10px'>No data loaded</div>")
        .attr("id", "datahint")
        .appendTo(this.jqview);

      // load data buttons
      $("<input type='button' id='load' value='Load Data'>")
        .button()
        .click(function(event, ui){
          var jqdialog = $("<div></div>");
          jqdialog
            .dialog({
              title: "Select a Dataset",
              buttons: [
                {
                  text: "OK",
                  click: function() {
                    var data = $(this).find("#data :selected").val(),
                        dataName = $(this).find("#data :selected").text();

                    node.loadData(data, dataName);

                    $(this).dialog("close");
                  }
                }
              ]
            });
          // hide the close button at the header bar
          /*
          jqdialog
            .dialog("widget")
            .find(".ui-dialog-titlebar-close")
            .hide();
          */
          // load data dialog content is stored in html
          jqdialog.load("js/dataflow/datasource/loaddata-dialog.html", function() {
            if (node.dataSelected != null) {
              $(this).find("#data").val(node.dataSelected);
            }
          });
        })
        .appendTo(this.jqview);

      if (this.dataName != null) {
        this.jqview.find("#datahint").text(this.dataName);
      }
    }

  },

  loadData: function(dataSelected, dataName) {
    var node = this;

    // add to async queue
    core.dataflowManager.asyncDataloadStart(this);

    if (dataSelected == "none") {
      this.jqview.find("#datahint")
        .text("No data loaded");
      this.dataSelected = dataSelected;
      this.dataName = null;
      $.extend(node.ports["out"].pack, DataflowPackage.new());
      core.dataflowManager.asyncDataloadEnd();  // propagate null data
      return;
    }

    // TODO re-use loaded data
    /*
    var data;
    if ((data = core.dataflowManager.data[dataSelected]) != null) {
      console.log("reused");
      node.dataSelected = dataSelected;
      node.dataName = dataName;
      node.jqview.find("#datahint").text(dataName);
      $.extend(node.ports["out"].pack, DataflowPackage.new(data));
      return;
    }
    */

    $.ajax({
      type: 'GET',
      url: "data/" + dataSelected + ".json",
      dataType: 'json',
      error: function(xhr, status, err){
        console.error("cannot load data\n" + status + "\n" + err);
      },
      success: function(result){
        if (result == null){
          console.error("loaded data is null");
          return;
        }
        node.dataSelected = dataSelected;
        node.dataName = dataName;
        node.jqview.find("#datahint").text(dataName);

        var data = DataflowData.new(result);

        core.dataflowManager.registerData(data);

        // overwrite data object (to keep the same reference)
        $.extend(node.ports["out"].pack, DataflowPackage.new(data));

        // decrement async count
        core.dataflowManager.asyncDataloadEnd(); // push changes
      }
    });
  }
};


var DataflowDataSource = DataflowNode.extend(extObject);
