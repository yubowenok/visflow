/**
 * @fileoverview Backdrop that blocks interaction.
 */

/** @const */
visflow.backdrop = {};

/**
 * Turns on off the backdrop.
 * @param {boolean} state
 */
visflow.backdrop.toggle = function(state) {
  $('#backdrop').toggle(state);
  if (state) {
    visflow.contextMenu.hide();
  }
};
