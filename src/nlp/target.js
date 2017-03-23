/**
 * Searches for a NLP target.
 * If there is a node selected, then the selected node is returned.
 * If none of the nodes are selected, then return the node with the highest
 * focus score.
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
    candidates.push({node: node, weight: node.focusScore()});
  }

  candidates.sort(function(a, b) {
    return b.weight - a.weight;
  });
  return _.first(candidates).node;
};
