/**
 * @fileoverview VisFlow panel.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *   id: string,
 *   name: string,
 *   class: ?string,
 *   css: Object,
 *   htmlFile: string,
 *   draggable: ?boolean,
 *   fadeIn: ?number,
 *   fadeInCssBegin: Object,
 *   fadeInCssEnd: Object,
 *   htmlLoadComplete: ?function(...*): *
 * }} params
 * @constructor
 */
visflow.Panel = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;
  /** @private {string} */
  this.id_ = params.id;
  /** @private {string} */
  this.name_ = params.name;
  /** @private {string} */
  this.class_ = params.class != null ? params.class : '';
  /** @private {!Object} */
  this.initCss_ = params.css != null ? params.css : {};
  /** @private {string} */
  this.htmlFile_ = params.htmlFile;
  /** @private {boolean} */
  this.draggable_ = params.draggable != null ? params.draggable : true;
  /** @private {!Array<!Object>} */
  this.buttons_ = params.buttons != null ? params.buttons : [];
  /** @private {!number} */
  this.fadeIn_ = params.fadeIn != null ? params.fadeIn : 1000;
  /** @private {!Object} */
  this.fadeInCssBegin_ = params.fadeInCssBegin != null ?
      params.fadeInCssBegin : {
        opacity: 0.0,
        top: -50
      };
  /** @private {!Object} */
  this.fadeInCssEnd_ = params.fadeInCssEnd != null ?
      params.fadeInCssEnd : {
        opacity: 1.0,
        top: '+=50'
      };
  /** @private {function(...*): *} */
  this.htmlLoadComplete_ = params.htmlLoadComplete != null ?
      params.htmlLoadComplete : function(){};

  this.container_.attr('id', this.id_);
};

/**
 * Displays the panel.
 */
visflow.Panel.prototype.show = function() {
  var container = $('<div></div>')
    .bind('contextmenu', function(){
      return false;
    })
    .addClass('panel')
    .addClass(this.class_)
    .appendTo(this.container_);

  container
    .load('./src/panel/' + this.htmlFile, function() {
      this.buttons_.map(function(button) {
        var jqbutton = this.container_.find('#' + button.id);
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

      }.bind(this));
      // prepare html, usually tooltips
      this.htmlLoadComplete_();
    }.bind(this));

  if (this.draggable_) {
    container.draggable();
  }

  if (this.fadeIn_ !== false) {
    container.css(this.fadeInCssBegin_);
    container.animate(this.fadeInCssEnd_, this.fadeIn_, function() {});
  }

  this.container_
    .css('position', 'absolute')
    .css(this.initCss_);
};
