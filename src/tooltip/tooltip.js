/**
 * @fileoverview VisFlow tooltip.
 */

'use strict';

/** @const */
visflow.tooltip = {};

/** @private @const {number} */
visflow.tooltip.DEFAULT_OFFSET_ = 5;
/** @private @const {number} */
visflow.tooltip.DEFAULT_DURATION_ = 500;
/** @private @const {number} */
visflow.tooltip.DEFAULT_DELAY_ = 1000;

/**
 * Creates a tooltip.
 * @param {string} text
 * @param {{
 *   left: (number|undefined),
 *   top: (number|undefined),
 *   duration: (number|undefined),
 *   delay: (number|undefined)
 * }=} opt_params
 */
visflow.tooltip.create = function(text, opt_params) {
  var params = _.extend({
    left: visflow.interaction.mouseX + visflow.tooltip.DEFAULT_OFFSET_,
    top: visflow.interaction.mouseY + visflow.tooltip.DEFAULT_OFFSET_,
    duration: visflow.tooltip.DEFAULT_DURATION_,
    delay: visflow.tooltip.DEFAULT_DELAY_
  }, opt_params);

  $('<div></div>')
    .addClass('visflow-tooltip')
    .text(text)
    .css(params)
    .appendTo('body')
    .delay(params.delay)
    .animate({
      opacity: 0
    }, params.duration, function() {
      $(this).remove();
    });
};
