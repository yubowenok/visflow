/**
 * @fileoverview Property editor options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.PropertyEditor = function(params) {
  visflow.options.PropertyEditor.base.constructor.call(this, params);

  /** @type {?string} */
  this.color = params.color;

  /** @type {?number} */
  this.border = params.border;

  /** @type {?number} */
  this.width = params.width;

  /** @type {?number} */
  this.size = params.size;

  /** @type {?number} */
  this.opacity = params.opacity;
};

_.inherit(visflow.options.PropertyEditor, visflow.options.Node);
