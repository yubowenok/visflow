
"use strict";

var extObject = {

  initialize: function() {
    this.topZindex = 0;
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
    this.menuPanel.hide();
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
      "histogram", "parallelcoordinates", "scatterplot", "table" // visualization
    ].map(function(id) {
      buttons.push({
        id: id,
        click: function(event) {
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
        }
      });
    });
    this.popupPanel = Panel.new({
      id: "popupPanel", // required by view
      name: "add",
      jqview: jqview,
      class: !compact ? "addpanel" : "addpanel-compact",
      rightClickClose: true,
      css: {
        left: event.pageX + 50, // always near mouse
        top: event.pageY
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
