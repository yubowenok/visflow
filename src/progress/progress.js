/**
 * @fileoverview System progress bar.
 * Only one progress bar is allowed at a time.
 * Progress bar can be positioned at the bottom-right or the middle of the
 * screen. Combine with visflow.backdrop to properly block interaction during
 * the progress.
 */

/** @const */
visflow.progress = {};

/** @private @const {string} */
visflow.progress.SELECTOR_ = '#progress';

/** @private {boolean} */
visflow.progress.isBackdropped_ = false;

/**
 * Starts a new progress.
 * @param {string} text Text to display for the progress.
 * @param {boolean=} opt_backdrop
 */
visflow.progress.start = function(text, opt_backdrop) {
  visflow.progress.isBackdropped_ = !!opt_backdrop;
  visflow.progress.setPercentage(0);
  $(visflow.progress.SELECTOR_).find('.progress-bar').text(text);
  $(visflow.progress.SELECTOR_).show();
  if (opt_backdrop) {
    visflow.backdrop.toggle(true);
  }
};

/**
 * Ends the progress bar.
 */
visflow.progress.end = function() {
  $(visflow.progress.SELECTOR_).hide();
  if (visflow.progress.isBackdropped_) {
    visflow.backdrop.toggle(false);
  }
};

/**
 * Sets the percentage of the progress bar.
 * @param {number} percent Between [0, 100].
 */
visflow.progress.setPercentage = function(percent) {
  $(visflow.progress.SELECTOR_).children('.progress-bar')
    .css('width', Math.ceil(percent * 100) + '%');
};
