/**
 * @fileoverview Data source options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.DataSource = function(params) {
  visflow.options.DataSource.base.constructor.call(this, params);

  /**
   * Whether to use data transpose.
   * @type {boolean}
   */
  this.transpose = !!params.transpose;

  /**
   * Name for the attribute column in transpose.
   * @type {string}
   */
  this.transposeName = params.transposeName !== undefined ?
    params.transposeName : 'attributes';

  /**
   * Dimensions used for transpose. -1 is index (visflow.data.INDEX_DIM).
   * @type {!Array<number>}
   */
  this.transposeKeys = params.transposeKeys !== undefined ?
    params.transposeKeys : [];

  /**
   * Transpose attributes, in dimension indices.
   * @type {!Array<number>}
   */
  this.transposeAttrs = params.transposeAttrs !== undefined ?
    params.transposeAttrs : [];

  /**
   * Whether to user server data set in the UI.
   * @type {boolean}
   */
  this.useServerData = !!params.useServerData;
};

_.inherit(visflow.options.DataSource, visflow.options.Node);
