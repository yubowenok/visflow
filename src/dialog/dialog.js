/**
 * @fileoverview VisFlow modal dialog.
 */

'use strict';

/** @const */
visflow.dialog = {};

/**
 * Creates a dialog with the given parameters.
 * @param {{
 *   template: string,
 *   complete: ?function(dialog: !jQuery, ...): *
 * }} params
 *   template: HTML of the dialog.
 *   complete: callback function called after the modal dialog is loaded
 *       first param is the modal dialog container.
 */
visflow.dialog.create = function(params) {
  if (params == null) {
    visflow.error('null parmas');
    return;
  }
  if (!params.template) {
    visflow.error('missing template');
    return;
  }
  if (!params.complete) {
    params.complete = function(dialog) {};
  }

  var dialog = $('#modal');
  dialog.find('.modal-content').load(params.template, function() {
    dialog.modal();
    params.complete(dialog);
  });
};

/**
 * Closes the dialog.
 */
visflow.dialog.close = function() {
  $('#modal').modal('hide');
};
