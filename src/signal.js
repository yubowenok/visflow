/**
 * @fileoverview System signals.
 */

/** @enum {number} */
visflow.Event = {
  PROCESSED: 0,
  READY: 1,
  VISMODE: 2,
  CHANGE: 3
};

/**
 * Signals a visflow event on the given object with the given data.
 * @param {Object|string} obj
 * @param {string|visflow.Event} event
 * @param {*=} data
 */
visflow.signal = function(obj, event, data) {
  $(obj).trigger('vf.' + event, [data]);
};

/**
 * Listens to a visflow event on a given object. If the event has any data,
 * it will be the second argument passed to callback(), i.e. callback will be
 * called as callback(event, data).
 * @param {Object|string} obj
 * @param {string|visflow.Event} event
 * @param {Function} callback
 */
visflow.listen = function(obj, event, callback) {
  $(obj).on('vf.' + event, callback);
};


/**
 * Stops listening to a visflow event on a given object.
 * @param {Object|string} obj
 * @param {string|visflow.Event} event
 */
visflow.unlisten = function(obj, event) {
  $(obj).off('vf.' + event);
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
