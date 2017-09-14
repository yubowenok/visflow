/**
 * @fileoverview System signals.
 */

/** @enum {number} */
visflow.Event = {
  PROCESSED: 0,
  READY: 1,
  VISMODE: 2,
  CHANGE: 3,
  EXPORT: 4,
  CLOSED: 5,
  MINIMIZE: 6,
  PANEL: 7,
  LABEL: 8,
  ADD_NODE: 9,
  NAVIGATION: 10,
  NODE_LABEL: 11,
  CONNECT: 12,
  DISCONNECT: 13,
  SELECT_ALL: 14,
  CLEAR_SELECTION: 15,
  LOGIN: 16,
  LOGOUT: 17,
  PUSH: 18,
  NO_UNDO: 19,
  NO_REDO: 20,
  BEFORE_OPEN: 21,
  ALT: 22,
  UPLOADED: 23,
  OPENED: 24,
  DELETE: 25,
  FLOWSENSE: 1000
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
 * @param {Object|string} object
 * @param {string|visflow.Event} event
 * @param {Function} callback
 */
visflow.listen = function(object, event, callback) {
  $(object).on('vf.' + event, callback);
};

/**
 * Listens to multiple visflow events and provides multiple handlers on a same
 * object in one batch.
 * @param {Object|string} object
 * @param {!Array<{
 *   event: (string|visflow.Event),
 *   callback: Function
 * }>} specs
 */
visflow.listenMany = function(object, specs) {
  specs.forEach(function(spec) {
    visflow.listen(object, spec.event, spec.callback);
  });
};

/**
 * Stops listening to a visflow event on a given object.
 * @param {Object|string} obj
 * @param {string|visflow.Event} event
 * @param {(function(jQuery.Event):?|string|undefined)=} opt_callback
 */
visflow.unlisten = function(obj, event, opt_callback) {
  $(obj).off('vf.' + event, opt_callback);
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
