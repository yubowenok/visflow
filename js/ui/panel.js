
// menu panel

"use strict";

var extObject = {
  initialize: function(para) {
    Panel.base.initialize.call(this, para); // call parent constructor

    this.name = para.name;
    this.initCss = para.css != null ? para.css : {};
    this.htmlFile = para.htmlFile;
    this.buttons = para.buttons != null ? para.buttons : [];
    this.fadeIn = para.fadeIn != null ? para.fadeIn : 1000;
    this.class = para.class != null ? para.class : "";
    this.htmlLoadComplete = para.htmlLoadComplete != null ? para.htmlLoadComplete : function(){};
  },

  show: function() {
    var panel = this;

    var container = $("<div></div>")
      .bind("contextmenu", function(){
        return false;
      })
      .addClass(this.class)
      .appendTo(this.jqview);

    container
      .draggable()
      .addClass("panel ui-widget ui-widget-content")
      .appendTo(this.jqview)
      .load("js/ui/" + this.htmlFile, function() {
        panel.buttons.map(function(button) {
          panel.jqview.find("#" + button.id).click(function(event){
            event.id = button.id;
            button.click(event);
          });
        });
        // prepare html, usually tooltips
        panel.htmlLoadComplete();
      });
    container
      .css({
        opacity: 0,
        left: -50
      });

    if (this.fadeIn !== false) {
      container.animate({
          opacity: 1.0,
          left: "+=50",
        }, this.fadeIn, function() {
      });
    }

    this.jqview
      .css("position", "absolute")
      .css(this.initCss);
  }
};

var Panel = View.extend(extObject);
