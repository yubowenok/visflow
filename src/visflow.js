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
  visflow.scales.init();

  visflow.menu.init();
  visflow.viewManager.init();
  visflow.flow.init();
  visflow.optionPanel.init();
  visflow.nodePanel.init();
  visflow.popupPanel.init();
  visflow.toolPanel.init();
  visflow.interaction.init();
  visflow.nlp.init();

  visflow.user.init();
};

/**
 * Tests if the client is using mobile device.
 * @return {boolean}
 */
visflow.isMobile = function() {
  return isMobile.phone || isMobile.tablet;
};

/**
 * Displays a user visible error message.
 * @param {...} args
 */
visflow.error = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  $('#error').text(msg).parent()
    .slideDown(visflow.const.ALERT_TRANSITION_DURATION);
};

/**
 * Displays a user visible warning message.
 * @param {...} args
 */
visflow.warning = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  $('#warning').text(msg).parent()
    .slideDown(visflow.const.ALERT_TRANSITION_DURATION)
    .delay(visflow.const.MESSAGE_DURATION)
    .slideUp(visflow.const.ALERT_TRANSITION_DURATION);
};

/**
 * Displays a user visible success message.
 * @param {...} args
 */
visflow.success = function(args) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  $('#success').text(msg).parent()
    .slideDown(visflow.const.ALERT_TRANSITION_DURATION)
    .delay(visflow.const.MESSAGE_DURATION)
    .slideUp(visflow.const.ALERT_TRANSITION_DURATION);
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
  window.open('doc.html');
};

/**
 * Opens an about dialog.
 */
visflow.about = function() {
  visflow.dialog.create({
    template: './dist/html/about/about.html'
  });
};

/**
 * Signals a visflow event on the given object.
 * @param {Object|string} obj
 * @param {string} event
 * @param {*=} data
 */
visflow.signal = function(obj, event, data) {
  $(obj).trigger('vf.' + event, [data]);
};

/**
 * Debugging global entry that is used to retrieve variable values.
 * @type {*}
 */
visflow.debug = null;
