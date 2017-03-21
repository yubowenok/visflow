/**
 * @fileoverview Value filter options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.ValueFilter = function(params) {
  visflow.options.ValueFilter.base.constructor.call(this, params);

  /**
   * Dimensions to be filtered on.
   * @type {!Array<number>}
   * TODO(bowen): change this to single dim, otherwise too confusing.
   */
  this.dims = params.dims !== undefined ? params.dims : [];

  /**
   * Whether input is treated as normal text or regex. 'text' or 'regex'.
   * @type {visflow.ValueFilter.Mode}
   */
  this.mode = params.mode !== undefined ? params.mode :
    visflow.ValueFilter.Mode.REGEX;

  /**
   * Matching target. 'full' or 'substring'.
   * @type {visflow.ValueFilter.Target}
   */
  this.target = params.target !== undefined ? params.target :
    visflow.ValueFilter.Target.FULL;

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

_.inherit(visflow.options.ValueFilter, visflow.options.Node);
