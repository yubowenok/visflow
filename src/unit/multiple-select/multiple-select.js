/**
 * @fileoverview VisFlow color scale select user interface.
 */

'use strict';

/**
 * @param {{
 *   container: !jQuery,
 *   list: !Array<{id: string|number, text: string}>,
 *   selected: (string|number)=
 *   listTitle: string=,
 *   allowClear: boolean=,
 *   selectTitle: string=
 * }} params
 * @constructor
 * @extends {visflow.Select}
 */
visflow.MultipleSelect = function(params) {
  visflow.MultipleSelect.base.constructor.call(this, params);
};

visflow.utils.inherit(visflow.MultipleSelect, visflow.Select);

/** @private @const {number} */
visflow.MultipleSelect.prototype.REMOVE_DELAY_ = 0;

/** @inheritDoc */
visflow.MultipleSelect.prototype.init_ = function() {
  this.container_.children('.select').addClass('multiple-select');

  var title = this.container_.find('#title');
  if (this.listTitle_) {
    title.text(this.listTitle_);
  } else {
    title.hide();
  }

  this.select2_ = this.container_.find('select')
    .select2({
      data: this.list_,
      allowClear: false,
      placeholder: this.selectTitle_,
      multiple: true
    });
  this.select2_.val(this.selected_).trigger('change');


  this.container_.find('.select2-selection__choice__remove')
    .click(function() {
      setTimeout(function() {
        $('.select2-dropdown').remove();
      }, this.REMOVE_DELAY_);
    });

  this.initEnd();
};

/** @inheritDoc */
visflow.MultipleSelect.prototype.change_ = function() {
  var val = this.select2_.val();
  if (this.selected_ !== val) {
    this.selected_ = val;
    this.signal_('change');
  }
};
