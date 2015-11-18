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
  visflow.menu.init();
  visflow.viewManager.init();
  visflow.flow.init();
  visflow.interactionManager.init();

  $('.visflow').on('click', '.system-message > .close', function(event) {
    $(this).parent().slideUp();
  });
};

/**
 * Displays a user visible error message.
 */
visflow.error = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  $('#error').text(msg).parent().slideDown();
};

/** @const {number} */
visflow.MESSAGE_DURATION_ = 2000;

/**
 * Displays a user visible warning message.
 */
visflow.warning = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  $('#warning').text(msg).parent()
    .slideDown()
    .delay(visflow.MESSAGE_DURATION_)
    .slideUp();
};

/**
 * Displays a user visible success message.
 */
visflow.success = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  $('#success').text(msg).parent()
    .slideDown()
    .delay(visflow.MESSAGE_DURATION_)
    .slideUp();
};

/**
 * Opens a documentation page.
 */
visflow.documentation = function() {
  window.open('help.html');
};

/**
 * Opens an about dialog.
 */
visflow.about = function() {
  visflow.dialog.create({
    template: './src/dialog/about.html'
  });
};
