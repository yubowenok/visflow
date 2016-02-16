/**
 * @fileoverview VisFlow namespace. System entry.
 */

/**
 * System kernel namespace.
 * @const
 */
var visflow = {};

/**
 * Initializes all visflow components.
 */
visflow.init = function() {
  visflow.utils.init();
  visflow.scales.init();

  visflow.menu.init();
  visflow.viewManager.init();
  visflow.flow.init();
  visflow.optionPanel.init();
  visflow.nodePanel.init();
  visflow.popupPanel.init();
  visflow.interaction.init();
};

/** @private @const {number} */
visflow.MESSAGE_DURATION_ = 2000;

/**
 * Displays a user visible error message.
 * @param {...} args
 */
visflow.error = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  $('#error').text(msg).parent().slideDown();
};

/**
 * Displays a user visible warning message.
 * @param {...} args
 */
visflow.warning = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  $('#warning').text(msg).parent()
    .slideDown()
    .delay(visflow.MESSAGE_DURATION_)
    .slideUp();
};

/**
 * Displays a user visible success message.
 * @param {...} args
 */
visflow.success = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  $('#success').text(msg).parent()
    .slideDown()
    .delay(visflow.MESSAGE_DURATION_)
    .slideUp();
};

/**
 * Asserts a condition. If false then panick.
 * @param {boolean} condition
 * @param {string=} opt_msg
 */
visflow.assert = function(condition, opt_msg) {
  if (!condition) {
    visflow.error('assert failed' + (opt_msg != null ? ':' : ''), opt_msg);
  }
};

/**
 * Opens a documentation page.
 */
visflow.documentation = function() {
  window.open('documentation.html');
};

/**
 * Opens an about dialog.
 */
visflow.about = function() {
  visflow.dialog.create({
    template: './src/dialog/about.html'
  });
};
