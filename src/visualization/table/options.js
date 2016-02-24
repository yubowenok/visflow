/**
 * @fileoverview Table options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Visualization}
 * @constructor
 */
visflow.options.Table = function(params) {
  visflow.options.Table.base.constructor.call(this, params);
  /**
   * pageLength of the dataTables
   * @type {number}
   */
  this.pageLength = params.pageLength !== undefined ? params.pageLength : 20;
};

_.inherit(visflow.options.Table, visflow.options.Visualization);
