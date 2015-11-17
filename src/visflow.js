/**
 * @fileoverview VisFlow namespace. System entry.
 */

'use strict';

/**
 * System kernel namespace.
 * @const
 */
var visflow = {};

/**
 * Initializes all visflow components.
 */
visflow.init = function() {
  visflow.viewManager.init();
  visflow.flowManager.init();
  visflow.interactionManager.init();

  visflow.viewManager.showMenuPanel();

  visflow.test.run();
};

/**
 * Displays a user visible warning message.
 */
visflow.warning = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  $('#warning').text(msg).parent().slideDown();
};

/**
 * Displays a user visible error message.
 */
visflow.error = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  $('#error').text(msg).parent().slideDown();
};

/**
 * Displays a user visible success message.
 */
visflow.success = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  $('#success').text(msg).parent().slideDown();
};
