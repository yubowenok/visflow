
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);

    this.inPorts = [];
    this.outPorts = [
      {
        id: "out",
        type: "out-multiple"
      }
    ];
  },

  show: function() {
    this.base.show.call(this); // call parent settings

    var jqview = this.jqview;

    $("<div>No data loaded</div>")
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
                $(this).dialog("close");
              }
            }
          ]
        });
        // hide the close button at the header bar
        jqdialog
          .dialog("widget")
          .find(".ui-dialog-titlebar-close")
          .hide();
        // load data dialog content is stored in html
        jqdialog.load("js/dataflow/datasource/loaddata-dialog.html", function() {
          // .. nothing
        });
      })
      .appendTo(this.jqview);
  }
};

var DataflowDataSource = DataflowNode.extend(extObject);
