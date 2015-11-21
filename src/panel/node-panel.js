/**
 * @fileoverview VisFlow panel for adding nodes.
 */

'use strict';

/** @const */
visflow.nodePanel = {};

/**
 * Node panel container.
 * @private {jQuery}
 */
visflow.nodePanel.container_;

visflow.nodePanel.init = function() {
  visflow.nodePanel.container_ = $('#node-panel');
};
