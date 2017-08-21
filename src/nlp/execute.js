/**
 * Executes an NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.execute = function(commands) {
  var type = visflow.nlp.getCommandType(_.first(commands).token);

  if (visflow.nlp.target == null && type != visflow.nlp.CommandType.LOAD) {
    visflow.warning(
      'Not sure about what data to act on. First load some data?');
    return;
  }

  switch (type) {
    case visflow.nlp.CommandType.LOAD:
      visflow.nlp.load(commands);
      break;
    case visflow.nlp.CommandType.CHART:
    case visflow.nlp.CommandType.CHART_FILTER:
      visflow.nlp.chart(commands);
      break;
    case visflow.nlp.CommandType.SELECT:
      visflow.nlp.select(commands);
      break;
    case visflow.nlp.CommandType.HIGHLIGHT:
      visflow.nlp.highlight(commands);
      break;
    case visflow.nlp.CommandType.FILTER:
    case visflow.nlp.CommandType.FIND:
      visflow.nlp.filter(commands);
      break;
    case visflow.nlp.CommandType.EXTRACT:
      visflow.nlp.extract(commands);
      break;
    case visflow.nlp.CommandType.LINK:
      visflow.nlp.link(commands);
      break;
    case visflow.nlp.CommandType.SET:
      visflow.nlp.set(commands);
      break;
    case visflow.nlp.CommandType.RENDERING_PROPERTY:
      visflow.nlp.renderingProperty(commands);
      break;
    case visflow.nlp.CommandType.AUTOLAYOUT:
      visflow.flow.autoLayoutAll();
      break;
    default:
      visflow.error('unknown command type');
  }
};

/**
 * Batch creates a list of nodes at given positions, and adjusts their layout
 * once done.
 * @param {!Array<{type: string, x: number, y: number}>} nodeInfo
 * @param {Function=} opt_callback
 * @param {boolean=} opt_adjustLayout
 * @return {!Array<!visflow.Node>} Nodes created. This is used for cross-type
 *     node creations and their post linkings.
 */
visflow.nlp.createNodes = function(nodeInfo, opt_callback, opt_adjustLayout) {
  var readyCounter = nodeInfo.length;
  var nodes = [];
  var movable = {};
  if (visflow.nlp.target) {
    movable[visflow.nlp.target.id] = true;
  }

  var directions = [[0, 0], [0, 1], [1, 0], [1, 1]];
  nodeInfo.forEach(function(info) {
    var node = visflow.flow.createNode(info.type);
    nodes.push(node);

    movable[+node.id] = true;
    var box = node.getBoundingBox();
    directions.forEach(function(delta) {
      var newMovable = visflow.flow.nearbyNodes(info.x + delta[0] * box.width,
        info.y + delta[1] * box.height);
      _.extend(movable, newMovable);
    });

    $(node).on('vf.ready', function() {
      node.moveTo(info.x, info.y);
      if (--readyCounter == 0 && opt_callback) {
        opt_callback(nodes);
        if (opt_adjustLayout !== false) {
          visflow.flow.autoLayout(movable);
        }
      }
      visflow.flow.addNodeSelection(node);
    });
  });
  return nodes;
};
