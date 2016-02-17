/**
 * @fileoverview Node options object definitions.
 */

/**
 * @param {{
 *   minimized: (boolean|undefined),
 *   label: (boolean|undefined),
 *   visMode: (boolean|undefined)
 * }} params
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
 * Extends the options itself by another options instance.
 * @param {!visflow.options.Node} options
 */
visflow.options.Node.prototype.extend = function(options) {
  _.extend(this, options);
};
