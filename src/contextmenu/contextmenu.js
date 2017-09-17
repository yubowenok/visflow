/**
 * @fileoverview VisFlow context menu.
 */

/**
 * Namespace for global call.
 * @const
 */
visflow.contextMenu = {};

/**
 * Item used to define VisFlow contextmenu.
 * @typedef {{
 *   id: string,
 *   text: string,
 *   icon: string
 * }}
 *   id: Menu entry key.
 *   text: Text to be displayed in the menu entry.
 *   icon: Icon css classes.
 */
visflow.contextMenu.Item;

/**
 * Hides the contextmenu.
 */
visflow.contextMenu.hide = function() {
  $('#context-menu').removeClass('open');
};

/**
 * Global hotkey settings for contextMenu items.
 * When context menus are shown, if the id of an item can be found in this list,
 * the hotkey defined here will be applied.
 * @const {!Array<{id: visflow.Event, hotkey: string}>}
 */
visflow.contextMenu.hotKeys = [
  {id: visflow.Event.ADD_NODE, hotkey: 'A'},
  {id: visflow.Event.DELETE, hotkey: 'CTRL + X'},
  {id: visflow.Event.VISMODE, hotkey: 'V'},
  {id: visflow.Event.PANEL, hotkey: 'P'},
  {id: visflow.Event.MINIMIZE, hotkey: 'M'},
  {id: visflow.Event.SELECT_ALL, hotkey: 'CTRL + A'},
  {id: visflow.Event.CLEAR_SELECTION, hotkey: 'CTRL + SHIFT + A'},
  {id: visflow.Event.NAVIGATION, hotkey: 'N'}
  //{id: visflow.Event.FLOWSENSE, hotkey: 'S'}
];


/**
 * @param {{
 *   container: !jQuery,
 *   items: !Array<!visflow.contextMenu.Item>
 * }} params
 * @constructor
 */
visflow.ContextMenu = function(params) {
  if (params == undefined) {
    visflow.error('no params given for ContextMenu');
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

  this.container_.on('contextmenu', function(event) {
    this.openMenu_(event);
    return false;
  }.bind(this));
};

/**
 * Opens the contextmenu.
 * @param {!jQuery.Event} event
 * @private
 */
visflow.ContextMenu.prototype.openMenu_ = function(event) {
  this.contextMenu_
    .addClass('open')
    .css({
      left: event.pageX,
      top: event.pageY
    });
  this.listItems_();
  visflow.signal(this, visflow.Event.BEFORE_OPEN, this.contextMenu_);
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
      .appendTo(li)
      .click(function(event) {
        event.stopPropagation();
        this.contextMenu_.removeClass('open');
        visflow.signal(this, item.id);
      }.bind(this));

    $('<i></i>')
      .addClass(item.icon == null ? 'glyphicon' : item.icon)
      .prependTo(a);

    $('<span></span>')
      .text(item.text)
      .appendTo(a);

    var hotkey = item.hotkey;
    if (hotkey == null) {
      visflow.contextMenu.hotKeys.forEach(function(key) {
        if (key.id == item.id) {
          hotkey = key.hotkey;
        }
      });
    }
    $('<span></span>')
      .addClass('hotkey')
      .text(hotkey == null ? '' : '( ' + hotkey + ' )')
      .appendTo(a);
  }, this);
};
