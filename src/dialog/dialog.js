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
 *       template HTML of the dialog
 *   complete: function(dialog: !jQuery, ...): *
 *       callback function called after the modal dialog is loaded
 *       first param is the modal dialog container
 * }} params
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
  if (!params.loadComplete) {
    params.loadComplete = function(dialog) {};
  }

  var dialog = $('#modal');
  dialog.find('.modal-content').load(params.template, function() {
    dialog.modal();
    params.complete(dialog);
  });
};
