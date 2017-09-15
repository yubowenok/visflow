/**
 * @fileoverview System signals.
 */

/** @enum {number} */
visflow.Event = {
  // generic
  ALT: 0,
  CHANGE: 1,
  OPENED: 2,
  VISIBLE: 3,
  VISMODE: 4,
  UPLOADED: 5,
  // options and global states
  DIAGRAM_EDITABLE: 6,
  NODE_LABEL: 7,
  NODE_PANEL: 8,

  // node states
  PROCESSED: 100,
  READY: 101,
  PANEL: 102,
  LABEL: 103,
  CLOSED: 105,
  MINIMIZE: 106,
  NAVIGATION: 10,

  // flow edits and actions
  ADD_NODE: 200,
  DELETE: 201,
  CONNECT: 202,
  DISCONNECT: 203,
  EXPORT: 204,
  EXPLORE: 205,
  BEFORE_OPEN: 206, // context menu

  // selection
  SELECT_ALL: 300,
  CLEAR_SELECTION: 301,

  // user
  LOGIN: 400,
  LOGOUT: 401,

  // history
  PUSH: 500,
  NO_UNDO: 501,
  NO_REDO: 502,

  // flowsense extension
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
