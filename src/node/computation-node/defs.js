/**
 * @fileoverview Computation node defs.
 */

/** @const {boolean} */
visflow.ComputationNode.prototype.IS_COMPUTATION_NODE = true;

/** @inheritDoc */
visflow.ComputationNode.prototype.contextMenuItems = function() {
  var items = visflow.ComputationNode.base.contextMenuItems();
  items.push({
    id: 'execute', text: 'Execute'
  });
  return items;
};
