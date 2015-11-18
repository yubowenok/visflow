/**
 * @fileoverview VisFlow panel.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Panel = function(params) {
  this.name = params.name;
  this.initCss = params.css != null ? params.css : {};
  this.htmlFile = params.htmlFile;
  this.buttons = params.buttons != null ? params.buttons : [];
  this.draggable = params.draggable != null ? params.draggable : true;

  this.fadeIn = params.fadeIn != null ? params.fadeIn : 1000;
  this.fadeInCssBegin = params.fadeInCssBegin != null ? params.fadeInCssBegin :
  {
    opacity: 0.0,
    top: -50
  };
  this.fadeInCssEnd = params.fadeInCssEnd != null ? params.fadeInCssEnd :
  {
    opacity: 1.0,
    top: '+=50',
  };
  this.class = params.class != null ? params.class : '';
  this.htmlLoadComplete = params.htmlLoadComplete != null ?
      params.htmlLoadComplete : function(){};

  this.jqview = params.jqview;
  this.id = params.id;
  this.name = params.name;

  this.jqview.attr('id', this.id);
};

/**
 * Displays the panel.
 */
visflow.Panel.prototype.show = function() {
  var panel = this;

  var container = $('<div></div>')
    .bind('contextmenu', function(){
      return false;
    })
    .addClass(this.class)
    .appendTo(this.jqview);

  container
    .addClass('panel')
    .appendTo(this.jqview)
    .load('/visflow/src/panel/' + this.htmlFile, function() {
      panel.buttons.map(function(button) {
        var jqbutton = panel.jqview.find('#' + button.id);
        if (button.dragstart != null) {
          jqbutton.draggable({
            revert: 'valid',
            revertDuration: 100,
            start: function(event){
              event.id = button.id;
              button.dragstart(event);
            }
          });
        }
        if (button.click != null) {
          jqbutton.click(function(event){
            event.id = button.id;
            button.click(event);
          });
        }
        if (button.mouseenter != null) {
          jqbutton.mouseenter(function(event) {
            event.id = button.id;
            button.mouseenter(event);
          });
        }
        if (button.mouseleave != null) {
          jqbutton.mouseleave(function(event) {
            event.id = button.id;
            button.mouseleave(event);
          });
        }

      });
      // prepare html, usually tooltips
      panel.htmlLoadComplete();
    });

  if (this.draggable) {
    container.draggable();
  }

  if (this.fadeIn !== false) {
    container.css(this.fadeInCssBegin);
    container.animate(this.fadeInCssEnd, this.fadeIn, function() {});
  }

  this.jqview
    .css('position', 'absolute')
    .css(this.initCss);
};
