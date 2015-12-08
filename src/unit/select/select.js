/**
 * @fileoverview VisFlow single select user interface.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: string|number, text: string}>,
 *   selected: (string|number)=
 *   listTitle: string=,
 *   allowClear: boolean=,
 *   selectTitle: string=,
 *   opening: function: boolean
 * }} params
 *     container: Container of the select.
 *     list: Items for selection.
 *     selected: Currently selected items.
 *     listTitle: Text title for the list.
 *     allowClear: Whether no selection is allowed, if false, then selected must
 *         be given.
 *     selectTitle: Text to show for add item select2. This will be used as
 *         placeholder.
 *     opening: Function that will be called before the select list is opened.
 *         This can be used to prevent the list from opening.
 * @constructor
 */
visflow.Select = function(params) {
  /** @private {!jQuery} */
  this.container_ = params.container;

  /** @private {!Array<{id: string|number, text:string}> */
  this.list_ = params.list.concat();

  /** @private {boolean} */
  this.allowClear_ = params.allowClear != null ? params.allowClear : false;

  if (!this.allowClear_ && params.selected == null) {
    visflow.error('allowClear is false but selected item is not given');
    return;
  }

  /** @private {!Array<string|number>} */
  this.selected_ = params.selected != null ? params.selected : '';

  /** @private {string} */
  this.listTitle_ = params.listTitle ? params.listTitle : '';

  /** @private {string} */
  this.selectTitle_ = params.selectTitle ? params.selectTitle: 'Select';

  /** @private {function: boolean} */
  this.opening_ = params.opening;

  /** @private {select2} */
  this.select2_;

  this.container_.load(this.TEMPLATE_, function() {
    this.init_();
  }.bind(this));
};

/** @private @const {string} */
visflow.Select.prototype.TEMPLATE_ = './src/unit/select/select.html';

/**
 * Initializes the list title and add item select2.
 * @private
 */
visflow.Select.prototype.init_ = function() {
  var title = this.container_.find('#title');
  if (this.listTitle_) {
    title.text(this.listTitle_);
  } else {
    title.hide();
  }

  this.select2_ = this.container_.find('select')
    .select2({
      data: this.list_,
      allowClear: this.allowClear_,
      placeholder: this.selectTitle_
    });
  this.select2_.val(this.selected_).trigger('change');

  this.initEnd();
};

/**
 * Adds common event listeners, adjust select2 width, etc.
 * @protected
 */
visflow.Select.prototype.initEnd = function() {
  this.container_.find('.select2-container').css('width', '');

  this.select2_
    .on('change', this.change_.bind(this))
    .on('select2:opening', function() {
      if (this.opening_) {
        return this.opening_();
      }
    }.bind(this))
};

/**
 * Handles select2 change.
 * @private
 */
visflow.Select.prototype.change_ = function() {
  var val = this.select2_.val();
  if (this.selected_ !== val) {
    this.selected_ = val;
    this.signal_('change');
  }
};

/**
 * Selects a given element.
 * @param {string} id
 */
visflow.Select.prototype.select = function(id) {
  this.selected_ = id;
  // Disable change_ callback to avoid event looping.
  this.select2_.off('change', this.change_.bind(this));
  this.select2_.val(id).trigger('change');
  this.select2_.on('change', this.change_.bind(this));
};

/**
 * Fires an event.
 * @param {string} type
 * @private
 */
visflow.Select.prototype.signal_ = function(type) {
  $(this).trigger('visflow.' + type, [this.selected_]);
};
