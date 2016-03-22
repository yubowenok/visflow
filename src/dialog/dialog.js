/**
 * @fileoverview VisFlow modal dialog.
 */

/** @const */
visflow.dialog = {};

/**
 * Creates a dialog with the given parameters.
 * @param {{
 *   template: string,
 *   complete: (function(!jQuery, ...): *|undefined),
 *   params: *
 * }} params
 *   template: HTML of the dialog.
 *   complete: callback function called after the modal dialog is loaded
 *       first param is the modal dialog container.
 *   params: parameters that are passed to the complete handler as the second
 *       argument.
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
    params.complete = function(dialog, params) {};
  }

  var dialog = $('#modal');
  dialog.find('.modal-content').load(params.template, function() {
    dialog.modal();
    params.complete(dialog, params.params);
  });
};

/**
 * Closes the dialog.
 */
visflow.dialog.close = function() {
  $('#modal').modal('hide');
};
