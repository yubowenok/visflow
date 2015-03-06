
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);

    this.inPorts = [];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  show: function() {
    DataflowNode.show.call(this); // call parent settings

    var jqview = this.jqview,
        view = this;

    $("<div style='line-height:50px'>No data loaded</div>")
      .attr("id", "datahint")
      .appendTo(this.jqview);

    // load data buttons
    $("<input type='button' id='load' value='Load Data'>")
      .button()
      .click(function(event, ui){
        var jqdialog = core.viewManager.createDialog();
        jqdialog
          .addClass("dialog-loaddata")
          .dialog({
          title: "Select a Dataset",
          buttons: [
            {
              text: "OK",
              click: function() {
                var data = $(this).find("#data :selected").val(),
                    dataname = $(this).find("#data :selected").text();
                jqview.find("#datahint")
                  .text(dataname);

                view.loadData(data);

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
          // .. nothing
        });
      })
      .appendTo(this.jqview);
  },

  loadData: function(dataName) {
    var node = this;
    $.ajax({
      type: 'GET',
      url: "data/car.json",
      dataType: 'json',
      error: function(xhr, status, err){
        console.error("cannot load data\n" + status + "\n" + err);
      },
      success: function(result){
        if (result == null){
          console.error("loaded data is null");
          return;
        }

        var data = DataflowData.new(result);

        core.dataflowManager.registerData(node.dataId, data);

        // overwrite data object (to keep the same reference)
        $.extend(true, node.ports["out"].pack, DataflowPackage.new(data));

        core.dataflowManager.propagate(node); // push changes
      }
    });
  }
};


var DataflowDataSource = DataflowNode.extend(extObject);
