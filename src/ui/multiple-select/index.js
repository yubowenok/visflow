/**
 * @fileoverview VisFlow color scale select user interface.
 */

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: (string|number), text: string}>,
 *   selected: (!Array<string|number>|undefined),
 *   listTitle: (string|undefined),
 *   allowClear: (boolean|undefined),
 *   selectTitle: (string|undefined)
 * }} params
 * @constructor
 * @extends {visflow.Select}
 */
visflow.MultipleSelect = function(params) {
  visflow.MultipleSelect.base.constructor.call(this, params);

  /**
   * @type {!Array<string|number>}
   */
  this.selected = params.selected !== undefined ? params.selected : [];
};

_.inherit(visflow.MultipleSelect, visflow.Select);

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
      // Prevent dropdown from hanging.
      setTimeout(function() {
        $('.select2-dropdown').remove();
      }, 0);
    });

  this.initEnd();
};

/** @inheritDoc */
visflow.MultipleSelect.prototype.change = function() {
  var val = /** @type {!Array<string>} */(this.select2.val());
  if (_.difference(this.selected, val).length ||
    _.difference(val, this.selected).length) {
    this.selected = val;
    visflow.signal(this, visflow.Event.CHANGE, this.selected);
  }
};
