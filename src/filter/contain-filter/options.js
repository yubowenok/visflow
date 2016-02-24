/**
 * @fileoverview Container filter options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.ContainFilter = function(params) {
  visflow.options.ContainFilter.base.constructor.call(this, params);

  /**
   * Dimensions to be filtered on.
   * @type {!Array<number>}
   */
  this.dims = params.dims !== undefined ? params.dims : [];

  /**
   * Whether input is treated as normal text or regex. 'text' or 'regex'.
   * @type {string}
   */
  this.mode = params.mode !== undefined ? params.mode : 'text';

  /**
   * Matching target. 'full' or 'substring'.
   * @type {string}
   */
  this.target = params.target !== undefined ? params.target : 'full';

  /**
   * Whether to ignore cases in matching.
   * @type {boolean}
   */
  this.ignoreCases = params.ignoreCase !== undefined ?
    !!params.ignoreCase : true;

  /**
   * Filtering value specified by directly typing in the input boxes.
   * Type-in value is stored as string.
   * @type {?string}
   */
  this.typeInValue = params.typeInValue !== undefined ?
    params.typeInValue : null;
};

_.inherit(visflow.options.ContainFilter, visflow.options.Node);
