
"use strict";

var extObject = {

  initialize: function() {
    this.topZindex = 0;
    this.menuOn = true;

    this.loadColorScales();
    this.colorScaleQueue = [];
  },

  showMenuPanel: function() {
    var manager = this;
    var jqview = $("<div></div>")
      .appendTo("body");

    this.menuPanel = Panel.new({
      id: "menuPanel", // required by view
      class: "menupanel",
      jqview: jqview,
      htmlFile: "menu-panel.html",
      buttons: [
      {
          id: "add",
          click: function(event) {
            manager.showAddPanel(event);
          }
        },
        {
          id: "new",
          click: function() {
            core.dataflowManager.lastFilename = "myDataflow";
            core.dataflowManager.clearDataflow();
          }
        },
        {
          id: "save",
          click: function() {
            core.dataflowManager.saveDataflow();
          }
        },
        {
          id: "load",
          click: function() {
            core.dataflowManager.loadDataflow();
          }
        },
        {
          id: "vismode",
          click: function() {
            core.dataflowManager.toggleVisMode();
          },
          mouseenter: function() {
            core.dataflowManager.previewVisMode(true);
          },
          mouseleave: function() {
            core.dataflowManager.previewVisMode(false);
          }
        },
        {
          id: "help",
          click: function() {
            manager.helpDataflow();
          }
        },
        {
          id: "about",
          click: function() {
            manager.aboutDataflow();
          }
        }
      ]
    });
    this.menuPanel.show();
  },

  hideMenuPanel: function() {
    this.menuOn = false;
    this.menuPanel.jqview.hide();
  },

  toggleMenuPanel: function() {
    this.menuOn = !this.menuOn;
    if (this.menuOn) {
      this.menuPanel.jqview.animate({
        opacity: 1.0,
        top: "+=50"
      }, 1000);
    } else {
      this.menuPanel.jqview.animate({
        opacity: 0.0,
        top: "-=50"
      }, 1000);
    }
  },

  closePopupPanel: function() {
    if (this.popupPanel) {
      this.popupPanel.jqview.remove();
      this.popupPanel = null;
    }
  },

  filterAddPanel: function(key) {
    if (this.popupPanel == null)
      return console.error("filterAddPanel found no addpanel");
    // two children(), there is a container div
    this.popupPanel.jqview.find(".group").not("." + key).remove();    this.popupPanel.jqview.find(".addpanel-button").not("." + key).remove();
  },

  showAddPanel: function(event, compact) {
    this.closePopupPanel();
    var manager = this;
    var jqview = $("<div></div>")
      .appendTo("body");

    var buttons = [];
    [ "datasrc",   // data source
      "range", "contain", // filter
      "property-editor", "property-mapping", // rendering property
      "intersect", "minus", "union",  // set
      "value-extractor", "value-maker",   // value
      "table", "histogram", "parallelcoordinates", // visualization
      "scatterplot", "heatmap", "network"
    ].map(function(id) {
      var callback = function(event) {
        //console.log("dataflow");
        var node = core.dataflowManager.createNode(id);
        node.jqview.css({
          left: event.pageX - node.jqview.width() / 2,
          top: event.pageY - node.jqview.height() / 2,
          opacity: 0.0,
          zoom: 2,
        });
        node.jqview.animate({
          opacity: 1.0,
          zoom: 1,
        }, 200, function(){
          node.jqview.css("zoom", "");
        });
        manager.closePopupPanel();
        $(".dataflow-dropzone-temp").remove();
        $("#dataflow").droppable("disable");
      };
      buttons.push({
        id: id,
        click: callback,
        dragstart: function(event) {

          var container = $("#popupPanel").find(".panel");

          // create a temporary droppable under #dataflow
          // so that we cannot drop the button to panel

          // container is under #popupPanel
          // container has size, #popupPanel has screen position offset
          $("<div></div>")
            .addClass("dataflow-dropzone-temp")
            .css({
              width: container.width(),
              height: container.height(),
              left: container.parent().offset().left,
              top: container.parent().offset().top
            })
            .appendTo("#dataflow")
            .droppable({
              accept: ".addpanel-button",
              greedy: true, // this will prevent #dataflow be dropped at the same time
              tolerance: "pointer"
            });
          $("#dataflow").droppable({
            disabled: false,
            accept: ".addpanel-button",
            drop: callback
          });
        }
      });
    });
    this.popupPanel = Panel.new({
      id: "popupPanel", // required by view
      name: "add",
      jqview: jqview,
      draggable: false,
      class: !compact ? "addpanel" : "addpanel-compact",
      css: {
        left: event.pageX + 50, // always near mouse
        top: Math.max(20,
          Math.min(event.pageY, $(window).height() - (compact ? 260 : 800)))
      },
      fadeIn: 200,
      htmlFile: !compact ? "add-panel.html" : "add-panel-compact.html",
      buttons: buttons,
      htmlLoadComplete: function() {
        jqview.find(".addpanel-button").tooltip({
          tooltipClass: "addpanel-tooltip",
          show: {
            delay: 1000
          }
        });
      }
    });
    this.popupPanel.show();
  },

  createNodeView: function(para) {
    if (para == null)
      para = {};
    var jqview = $("<div></div>")
      .appendTo("#dataflow");
    jqview.css(para);
    return jqview;
  },

  createEdgeView: function(para) {
    if(para == null)
      para = {};
    var jqview = $("<div></div>")
      .appendTo("#dataflow-edges");
    jqview.css(para);
    return jqview;
  },

  removeNodeView: function(jqview) {
    $(jqview).remove();
  },

  removeEdgeView: function(jqview) {
    $(jqview).remove();
  },

  clearDataflowViews: function() {
    $(".dataflow-node").remove();
    $("#dataflow-edges").children().remove();
    // after this, nodes and edges cannot reuse their jqview
  },

  addEdgeHover: function(edge) {
    var jqview = edge.jqview;
    // make a shadow
    jqview.children(".dataflow-edge-segment").clone()
      .appendTo("#dataflow-hover")
      .addClass("dataflow-edge-segment-hover dataflow-edge-clone");
    jqview.children().clone()
      .appendTo("#dataflow")
      .addClass("dataflow-edge-clone");
    // copy port
    edge.sourcePort.jqview
      .clone()
      .appendTo("#dataflow")
      .addClass("dataflow-edge-clone")
      .css(edge.sourcePort.jqview.offset());
    edge.targetPort.jqview
      .clone()
      .appendTo("#dataflow")
      .addClass("dataflow-edge-clone")
      .css(edge.targetPort.jqview.offset());
  },

  clearEdgeHover: function() {
    $("#dataflow").find(".dataflow-edge-clone")
      .remove();
  },

  hideColorpickers: function(exception) {
    $(".iris-picker").not(exception).hide();
  },

  bringFrontView: function(jqview) {
    jqview
      .css("z-index", ++this.topZindex);
  },

  getTopZindex: function() {
    return this.topZindex;
  },

  getPopupPanelName: function() {
    if (this.popupPanel == null)
      return null;
    return this.popupPanel.name;
  },

  loadColorScales: function() {
    var manager = this;
    $.get("js/dataflow/unit/colorScales.json", function(scales) {
      var list = [];
      manager.colorScales = {};
      for (var i in scales) {
        var scale = scales[i];
        // save to node, map from value to scale object
        manager.colorScales[scale.value] = scale;

        var div = $("<div></div>")
          .addClass("dataflow-scalevis");
        var gradient = "linear-gradient(to right,";
        if (scale.type == "color") {
          // NOT support uneven scales
          for (var j in scale.range) {
            gradient += scale.range[j];
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        } else if (scale.type == "color-category10") {
          scale.domain = d3.range(10);
          scale.range = d3.scale.category10().range();
          var n = scale.range.length;
          for (var j = 0; j < n; j++) {
            gradient += scale.range[j] + " " + (j * 100 / n) + "%,";
            gradient += scale.range[j] + " " + ((j + 1) * 100 / n) + "%";
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        }
        list.push({
          value: scale.value,
          text: scale.text,
          div: div
        });
      }
      manager.colorScaleList = list;

      for (var i in manager.colorScalesQueue) {
        var callback = manager.colorScalesQueue[i];
        callback();
      }
    });
  },

  getColorScales: function(unitCallback){
    if (this.colorScales == null) {
      this.colorScalesQueue.push(unitCallback);
      console.log("q");
      return null;
    }
    return this.colorScales;
  },

  tip: function(text, csspara) {
    // csspara is the css object to define the tip's position, style, etc
    if (csspara == null)
      // by default show at mouse cursor
      csspara = {
        left: core.interactionManager.currentMouseX + 5,
        top: core.interactionManager.currentMouseY + 5
      };

    $("<div></div>")
      .addClass("tip-mouse ui-tooltip ui-tooltip-content")
      .text(text)
      .css(csspara)
      .appendTo("body")
      .delay(1000)
      .animate({
        opacity: 0
      }, 500, function() {
        $(this).remove();
      });
  },

  // check if two rectangular boxes intersect
  intersectBox: function(box1, box2) {
    var x1l = box1.left,
        x1r = box1.left + box1.width,
        y1l = box1.top,
        y1r = box1.top + box1.height;
    var x2l = box2.left,
        x2r = box2.left + box2.width,
        y2l = box2.top,
        y2r = box2.top + box2.height;
    return x1l <= x2r && x2l <= x1r && y1l <= y2r && y2l <= y1r;
  },

  // display a dialog showing info
  aboutDataflow: function() {
    var dialog = $("<div></div>")
      .css("padding", "20px")
      .dialog({
        modal: true,
        title: "About Dataflow",
        buttons: {
          OK: function() {
            $(this).dialog("close");
          }
        }
      });
    $( "<p>Dataflow Visualization Builder</p>"
     + "<p>Preliminary Version, Bowen Yu, March 2015</p>")
      .appendTo(dialog);
  },

  // display a help dialog
  helpDataflow: function() {
    window.open("help.html");
  }
};

var ViewManager = Base.extend(extObject);
