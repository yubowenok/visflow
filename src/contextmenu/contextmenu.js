/**
 * @fileoverview VisFlow context menu.
 */

'use strict';

/**
 * Namespace for global call.
 * @const
 */
visflow.contextMenu = {};

/**
 * @typedef {{id: string, text: string, icon: string}}
 */
visflow.contextMenu.Entry;

/**
 * Hides the contextmenu.
 */
visflow.contextMenu.hide = function() {
  $('#context-menu').removeClass('open');
};

/**
 * Item used to define VisFlow contextmenu.
 * @typedef {{
 *    id: string,
 *        menu entry key
 *    text: string,
 *        text to display in the menu entry
 *    icon: ?string
 *        icon classes
 * }}
 */
visflow.contextMenu.Item;

/**
 * @param {{
 *   container: !jQuery,
 *   items: !Array<!visflow.contextMenu.Item>
 * }} params
 * @constructor
 */
visflow.ContextMenu = function(params) {
  if (params == null) {
    visflow.error('null params');
    return;
  }

  /** @private {!jQuery} */
  this.contextMenu_ = $('#context-menu');

  /** @private {!jQuery} */
  this.container_ = params.container;

  /**
   * Reference to the menu items.
   * @private {!Array<!visflow.contextMenu.Item>}
   */
  this.items_ = params.items;

  /**
   * Function called before menu is open.
   * @private
   */
  this.beforeOpen_ = params.beforeOpen ? params.beforeOpen : function() {};

  this.container_.on('contextmenu', function(event) {
    this.openMenu_(event);
    return false;
  }.bind(this));
};

/**
 * Opens the contextmenu.
 * @param {!jQuery.event} event
 * @private
 */
visflow.ContextMenu.prototype.openMenu_ = function(event) {
  this.beforeOpen_();
  this.contextMenu_
    .addClass('open')
    .css({
      left: event.pageX,
      top: event.pageY
    });
  this.listItems_();
};

/**
 * Adds items to the context menu.
 * @private
 */
visflow.ContextMenu.prototype.listItems_ = function() {
  this.contextMenu_.find('li').remove();

  this.items_.forEach(function(item) {
    var li = $('<li></li>')
      .appendTo(this.contextMenu_.children('ul'));

    var a = $('<a></a>')
      .attr('id', item.id)
      .text(item.text)
      .appendTo(li)
      .click(function(event) {
        event.stopPropagation();
        this.contextMenu_.removeClass('open');
        this.signal_(item.id);
      }.bind(this));

    if (item.icon) {
      $('<i></i>')
        .addClass(item.icon)
        .prependTo(a);
    }
  }, this);
};

/**
 * Signals a menu click event for the selected entry id.
 */
visflow.ContextMenu.prototype.signal_ = function(id) {
  $(this).trigger('visflow.' + id);
};

