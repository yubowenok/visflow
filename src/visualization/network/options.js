/**
 * @fileoverview Network options.
 */

/**
 * @param {!Object} params
 * @extends {visflow.options.Node}
 * @constructor
 */
visflow.options.Network = function(params) {
  visflow.options.Network.base.constructor.call(this, params);

  /**
   * Whether to show label.
   * @type {boolean}
   */
  this.nodeLabel = !!params.nodeLabel;

  /**
   * Which dimension is used as label.
   * @type {number}
   */
  this.labelBy = params.labelBy !== undefined ? params.labelBy : 0;

  /**
   * D3 force-directed layout link distance.
   * @type {number}
   */
  this.distance = params.distance !== undefined ? params.distance : 30;

  /**
   * Node identifier used by edges.
   * @type {number}
   */
  this.nodeIdBy = params.nodeIdBy !== undefined ? params.nodeIdBy : 0;

  /**
   * Edge dimension used as source (node id).
   * @type {number}
   */
  this.sourceBy = params.sourceBy !== undefined ? params.sourceBy : 0;

  /**
   * Edge dimension used as target (node id).
   * @type {number}
   */
  this.targetBy = params.targetBy !== undefined ? params.targetBy : 1;

  /**
   * Whether navigation is enabled.
   * @type {boolean}
   */
  this.navigation = !!params.navigation;
};

_.inherit(visflow.options.Network, visflow.options.Visualization);
