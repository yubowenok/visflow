/**
 * @fileoverview VisFlow editable list user interface.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *       Container of the list
 *   list: !Array<{id: string|number, text: string}>,
 *       Items for selection
 *   selected: Array<string|number>
 *       Currently selected items
 *   listTitle: string,
 *       Text title for the list
 *   addTitle: string,
 *       Text to show for add item select2
 * }} params
 * @constructor
 */
visflow.EditableList = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {!Array<{id: string|number, text:string}> */
  this.list_ = params.list.concat();

  /** @private {!Array<string|number>} */
  this.selected_ = params.selected ? params.selected.concat() : [];

  /** @private {string} */
  this.listTitle_ = params.listTitle ? params.listTitle : '';

  /** @private {string} */
  this.addTitle_ = params.addTitle ? params.addTitle: 'Add Item';

  /**
   * Mapping from item id to item text.
   * @private {string}
   */
  this.itemText_ = {};
  this.list_.forEach(function(item) {
    this.itemText_[item.id] = item.text;
  }.bind(this));

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
    this.createItems_();
  }.bind(this));
};

/** @private @const {string} */
visflow.EditableList.prototype.TEMPLATE_ =
    './src/unit/editable-list/editable-list.html';

/**
 * Initializes the list title and add item select2.
 * @private
 */
visflow.EditableList.prototype.init_ = function() {
  this.container_.find('#list #title')
    .text(this.listTitle_);

  var select2 = this.container_.find('#add').children('select')
    .select2({
      data: this.list_,
      allowClear: true,
      placeholder: this.addTitle_
    });

  this.container_.find('.select2-container').css('width', '');

  select2.on('change', function() {
    var id = select2.val();
    if (id != '') {
      this.selected_.push(id);
      this.createItems_();
      select2.val('').trigger('change');

      this.signal_('change');
    }
  }.bind(this));

  this.container_.find('#list > ul').sortable({
    change: this.sortableChanged_.bind(this)
  });
};

/**
 * Creates the interactive list items.
 * @private
 */
visflow.EditableList.prototype.createItems_ = function() {
  var ul = this.container_.find('#list > ul');

  // Clear everything. Not ideal but it works for now...
  ul.children('li').remove();

  this.selected_.forEach(function(id) {
    var li = this.container_.find('#item-template').clone()
      .show()
      .appendTo(ul);
    li.children('.close').click(function() {
      this.deleteItem_(id);
    }.bind(this));
    li.children('span').text(this.itemText_[id]);
    li.attr('id', id);
  }, this);
};

/**
 * Deletes an element from the list.
 * @param {string|number} id
 * @private
 */
visflow.EditableList.prototype.deleteItem_ = function(id) {
  // Treat string and number uniformly.
  var index = this.selected_.map(function(e) {
    return '' + e;
  }).indexOf('' + id);

  visflow.assert(index != -1, 'deleted id not found');

  this.selected_.splice(index, 1);
  this.createItems_();
  this.signal_('change');
};

/**
 * Handles user dragged order change.
 * @param {!jQuery} event
 * @private
 */
visflow.EditableList.prototype.sortableChanged_ = function(event, ui) {
  var lis = this.container_.find('#list .item')
    .not('.ui-sortable-helper');
  this.selected_ = [];
  lis.each(function(index, li) {
    var id = $(li).hasClass('ui-sortable-placeholder') ?
      $(ui.item).attr('id') : $(li).attr('id');
    this.selected_.push(id);
  }.bind(this));
  this.signal_('change');
};

/**
 * Fires an event.
 * @param {string} type
 * @private
 */
visflow.EditableList.prototype.signal_ = function(type) {
  $(this).trigger('visflow.' + type, [this.selected_.concat()]);
};