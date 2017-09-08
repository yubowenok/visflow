/**
 * @fileoverview VisFlow single select user interface.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: (string|number), text: string}>,
 *   selected: (string|number|undefined),
 *   listTitle: (string|undefined),
 *   allowClear: (boolean|undefined),
 *   selectTitle: (string|undefined),
 *   opening: function(): boolean
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
  /** @protected {!jQuery} */
  this.container = params.container;

  /** @protected {!Array<{id: (string|number), text: string}>} */
  this.list = params.list.concat();

  /** @private {boolean} */
  this.allowClear_ = params.allowClear != null ? params.allowClear : false;

  if (!this.allowClear_ && params.selected == null) {
    visflow.error('allowClear is false but selected item is not given');
    return;
  }

  /** @protected {string|number} */
  this.selected = params.selected != null ? params.selected : '';

  /** @protected {string} */
  this.listTitle = params.listTitle ? params.listTitle : '';

  /** @protected {string} */
  this.selectTitle = params.selectTitle ? params.selectTitle : 'Select';

  /** @private {function(): boolean} */
  this.opening_ = params.opening;

  /** @protected {select2|undefined} */
  this.select2 = undefined;

  this.container.load(this.TEMPLATE_, function() {
    this.init();
  }.bind(this));
};

/** @private @const {string} */
visflow.Select.prototype.TEMPLATE_ = './dist/html/ui/select/select.html';

/**
 * Initializes the list title and add item select2.
 * @protected
 */
visflow.Select.prototype.init = function() {
  var title = this.container.find('#title');
  if (this.listTitle) {
    title.text(this.listTitle);
  } else {
    title.hide();
  }

  this.select2 = this.container.find('select')
    .select2({
      data: this.list,
      allowClear: this.allowClear_,
      placeholder: this.selectTitle
    });
  this.select2.val(this.selected).trigger('change');

  this.initEnd();
};

/**
 * Adds common event listeners, adjust select2 width, etc.
 * @protected
 */
visflow.Select.prototype.initEnd = function() {
  this.container.find('.select2-container').css('width', '');

  this.select2
    .on('change', this.change.bind(this))
    .on('select2:opening', function() {
      if (this.opening_) {
        return this.opening_();
      }
    }.bind(this))
    .on('select2:unselect', function() {
      // Prevent dropdown from hanging.
      setTimeout(function() {
        $('.select2-dropdown').remove();
      }, 0);
    });
};

/**
 * Handles select2 change.
 * @protected
 */
visflow.Select.prototype.change = function() {
  var val = /** @type {string} */(this.select2.val());
  if (this.selected !== val) {
    this.selected = val;
    visflow.signal(this, visflow.Event.CHANGE, this.selected);
  }
};

/**
 * Selects a given element.
 * @param {string} id
 */
visflow.Select.prototype.select = function(id) {
  this.selected = id;
  // Disable change_ callback to avoid event looping.
  this.select2.off('change', this.change.bind(this));
  this.select2.val(id).trigger('change');
  this.select2.on('change', this.change.bind(this));
};
