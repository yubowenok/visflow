/**
 * @fileoverview VisFlow system options.
 */

'use strict';

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
    visflow.options.signal_('change', {
      type: 'nodeLabel',
      value: newState
    });
  }
};

/**
 * Fires an event with given type and data.
 * @param {string} eventType
 * @param {*=} opt_data
 * @private
 */
visflow.options.signal_ = function(eventType, opt_data) {
  $(visflow.options).trigger('visflow.' + eventType, [opt_data]);
};
