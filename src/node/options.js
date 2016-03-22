/**
 * @fileoverview Node options object definitions.
 */

/**
 * @param {!Object} params
 * @constructor
 */
visflow.options.Node = function(params) {
  /**
   * Whether to node icon instead of node details.
   * @type {boolean}
   */
  this.minimized = !!params.minimized;

  /**
   * Whether to show node label.
   * @type {boolean}
   */
  this.label = !!params.label;

  /**
   * Whether the node is visible in visMode.
   * @type {boolean}
   */
  this.visMode = !!params.visMode;
};

/**
 * Extends the options itself by another options instance. All values in options
 * that are not 'undefined' will be overwriting the values in 'this' options.
 * We distinguish 'undefined' from 'null' as 'null' may have special meanings.
 * @param {!visflow.options.Node} options
 */
visflow.options.Node.prototype.extend = function(options) {
  for (var key in options) {
    if (options[key] !== undefined) {
      this[key] = options[key];
    }
  }
};
