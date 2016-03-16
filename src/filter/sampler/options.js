/**
 * @fileoverview Sampler options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.Sampler = function(params) {
  visflow.options.Sampler.base.constructor.call(this, params);

  /**
   * Dimension to be filtered on.
   * @type {number}
   */
  this.dim = params.dim !== undefined ? params.dim : 0;


  /**
   * Filtering conditions: 'first', 'last' or 'sampling'.
   * @type {string}
   */
  this.condition = params.condition !== undefined ?
    params.condition : 'sampling';

  /**
   * Filtering modes, 'count' or 'percentage'.
   * @type {string}
   */
  this.mode = params.mode !== undefined ? params.mode : 'percentage';

  /**
   * Filtering count or percentage.
   * @type {number}
   */
  this.number = params.number != null ? params.number : 5;

  /**
   * Group by dimension.
   * @type {string}
   */
  this.groupBy = params.groupBy !== undefined ? params.groupBy : '';

  /**
   * Whether the values shall be uniqued before data items are filtered.
   * @type {boolean}
   */
  this.unique = !!params.unique;
};

_.inherit(visflow.options.Sampler, visflow.options.Node);
