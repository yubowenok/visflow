/**
 * @fileoverview VisFlow editable list user interface.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: (string|number), text: string}>,
 *   selected: Array<string|number>,
 *   listTitle: string,
 *   addTitle: string,
 *   allowClear: boolean
 * }} params
 *     container: Container of the list.
 *     list: Items for selection.
 *     selected: Currently selected item(s).
 *     listTitle: Text title for the list.
 *     addTitle: Text to show for add item select2.
 * @constructor
 */
visflow.EditableList = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {!Array<{id: (string|number), text: string}>} */
  this.list_ = params.list.concat();

  /** @private {!Array<string|number>} */
  this.selected_ = params.selected ? params.selected.concat() : [];

  /** @protected {string} */
  this.listTitle = params.listTitle ? params.listTitle : '';

  /** @private {string} */
  this.addTitle_ = params.addTitle ? params.addTitle : 'Add Item';

  /** @private {boolean} */
  this.allowClear_ = params.allowClear != null ? params.allowClear : true;

  /**
   * Mapping from item id to item text.
   * @private {!Object<string>}
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
    './dist/html/ui/editable-list/editable-list.html';

/**
 * Initializes the list title and add item select2.
 * @private
 */
visflow.EditableList.prototype.init_ = function() {
  this.container_.find('#list #title')
    .text(this.listTitle);

  var select2 = this.container_.find('#add').children('select')
    .select2({
      data: this.list_,
      allowClear: true,
      placeholder: this.addTitle_
    });

  this.container_.find('.select2-container').css('width', '');

  this.container_.find('#all').click(function() {
    this.selected_ = this.list_.map(function(item) {
      return item.id;
    });
    this.createItems_();
    visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
  }.bind(this));
  this.container_.find('#clear').click(function() {
    this.selected_ = this.allowClear_ ? [] : this.selected_.slice(0, 1);
    this.createItems_();
    visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
  }.bind(this));
  this.container_.find('#sort').click(function() {
    this.selected_.sort(function(a, b) {
      return visflow.utils.compare(this.list_[a].text, this.list_[b].text);
    }.bind(this));
    this.createItems_();
    visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
  }.bind(this));

  select2.on('change', function() {
    var id = /** @type {string} */(select2.val());
    if (id != '') {
      this.selected_.push(id);
      this.createItems_();
      select2.val('').trigger('change');

      visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
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
  var template = this.container_.find('#item-template');
  // Clear everything. Not ideal but it works for now...
  ul.children('li').remove();

  this.selected_.forEach(function(id) {
    var li = template.clone()
      .show()
      .appendTo(ul);

    if (!this.allowClear_ && this.selected_.length == 1) {
      li.children('.close').hide();
    }

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
  visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
};

/**
 * Handles user dragged order change.
 * @param {!jQuery} event
 * @param {{
 *   item: !jQuery
 * }} ui
 * @private
 */
visflow.EditableList.prototype.sortableChanged_ = function(event, ui) {
  var lis = this.container_.find('#list .item')
    .not('.ui-sortable-helper');
  this.selected_ = [];
  lis.each(function(index, li) {
    var id = $(li).hasClass('ui-sortable-placeholder') ?
      $(ui.item).attr('id') : $(li).attr('id');
    this.selected_.push(/** @type {string} */(id));
  }.bind(this));
  visflow.signal(this, visflow.Event.CHANGE, this.selected_.slice());
};
