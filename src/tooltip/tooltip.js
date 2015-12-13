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
 *   left: number=
 *   top: number=,
 *   duration: number=,
 *   delay: number=
 * }=} opt_params
 */
visflow.tooltip.create = function(text, opt_params) {
  var params = _({
    left: visflow.interaction.mouseX + visflow.tooltip.DEFAULT_OFFSET_,
    top: visflow.interaction.mouseY + visflow.tooltip.DEFAULT_OFFSET_,
    duration: visflow.tooltip.DEFAULT_DURATION_,
    delay: visflow.tooltip.DEFAULT_DELAY_
  }).extend(opt_params);

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
