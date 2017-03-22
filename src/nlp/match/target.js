/** @private @const {number} */
visflow.nlp.DISTANCE_ALPHA_ = 2;

/** @private @const {number} */
visflow.nlp.DISTANCE_BETA_ = 5;

/** @private @const {number} */
visflow.nlp.DISTANCE_GAMMA_ = 500;

/**
 * Searches for a NLP target.
 * If there is a node selected, then the selected node is returend.
 * If none of the nodes are selected, then return the node with the highest
 * combined score, a.k.a. activeness + distance to mouse.
 * @return {?visflow.Node}
 */
visflow.nlp.findTarget = function() {
  if (!$.isEmptyObject(visflow.flow.nodesSelected)) {
    // If there is a selection, return any node selected.
    for (var nodeId in visflow.flow.nodesSelected) {
      return visflow.flow.nodes[nodeId];
    }
  }
  var candidates = [];
  for (var id in visflow.flow.nodes) {
    var node = visflow.flow.nodes[id];
    if (node.IS_VALUE) {
      continue; // Skip nodes that do not output subset.
    }
    var d = node.distanceToMouse() / visflow.nlp.DISTANCE_GAMMA_;

    // dFactor is the flipped & shifted sigmoid function
    // 1 - 1 / (1 + e^-(d/gamma - beta))
    var dFactor = (1.0 - 1.0 /
      (1 + Math.exp(-(d - visflow.nlp.DISTANCE_BETA_))));

    var weight = node.activeness + visflow.nlp.DISTANCE_ALPHA_ * dFactor;
    candidates.push({node: node, weight: weight});
  }

  candidates.sort(function(a, b) {
    return b.weight - a.weight;
  });
  return _.first(candidates).node;
};
