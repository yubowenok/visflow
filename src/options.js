/**
 * @fileoverview VisFlow system options and options namespace.
 */

/** @const */
visflow.options = {};

/**
 * Whether to show the node labels.
 * @type {boolean}
 */
visflow.options.nodeLabel = true;

/**
 * Toggles or sets the node label visibility.
 * @param {boolean=} opt_state
 */
visflow.options.toggleNodeLabel = function(opt_state) {
  var newState = opt_state != null ? opt_state : !visflow.options.nodeLabel;
  if (newState != visflow.options.nodeLabel) {
    visflow.options.nodeLabel = newState;

    visflow.signal(visflow.options, 'change', {
      type: 'nodeLabel',
      value: newState
    });
  }
};
