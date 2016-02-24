/**
 * @fileoverview VisFlow color scale select user interface.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: (string|number), text: string}>,
 *   selected: (string|number|undefined),
 *   listTitle: (string|undefined),
 *   allowClear: (boolean|undefined),
 *   selectTitle: (string|undefined)
 * }} params
 * @constructor
 * @extends {visflow.Select}
 */
visflow.MultipleSelect = function(params) {
  visflow.MultipleSelect.base.constructor.call(this, params);
};

_.inherit(visflow.MultipleSelect, visflow.Select);

/** @private @const {number} */
visflow.MultipleSelect.prototype.REMOVE_DELAY_ = 0;

/** @inheritDoc */
visflow.MultipleSelect.prototype.init = function() {
  this.container.children('.select').addClass('multiple-select');

  var title = this.container.find('#title');
  if (this.listTitle) {
    title.text(this.listTitle);
  } else {
    title.hide();
  }

  this.select2 = this.container.find('select')
    .select2({
      data: this.list,
      allowClear: false,
      placeholder: this.selectTitle,
      multiple: true
    });
  this.select2.val(this.selected).trigger('change');


  this.container.find('.select2-selection__choice__remove')
    .click(function() {
      setTimeout(function() {
        $('.select2-dropdown').remove();
      }, this.REMOVE_DELAY_);
    });

  this.initEnd();
};

/** @inheritDoc */
visflow.MultipleSelect.prototype.change = function() {
  var val = /** @type {string} */(this.select2.val());
  if (this.selected !== val) {
    this.selected = val;
    this.signal('change');
  }
};
