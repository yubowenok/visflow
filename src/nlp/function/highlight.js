/**
 * Expands diagram for highlighting from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.highlight = function(commands) {
  if (commands.length < 2 ||
    commands[0].token != visflow.nlp.Keyword.HIGHLIGHT ||
    commands[1].token != visflow.nlp.Keyword.SELECTION) {
    console.error('unexpected highlight command');
    return;
  }
  commands = commands.slice(2);

  var fromNode = visflow.nlp.target;
  if (commands.length && commands[0].token == visflow.nlp.Keyword.FROM) {
    if (!commands[0] ||
      commands[1].syntax != visflow.nlp.Keyword.CHART_TYPE) {
      console.error('unexpected highlight source');
      return;
    }
    // Try to find the user's current focus, and highlight from there.
    if (!fromNode.matchType(commands[1].token)) {
      var newTarget = visflow.flow.closestNodeToMouse({
        type: commands[1].token
      });
      if (!newTarget) {
        // If we can find a match, then use the new target.
        // Otherwise proceed with the previous target.
        visflow.nlp.target = newTarget;
      }
    }
    commands = commands.slice(2);
  }
  var target = visflow.nlp.target;
  if (!target.IS_VISUALIZATION) {
    visflow.error('node does not have selection to be highlighted');
    return;
  }

  var chartType = visflow.nlp.DEFAULT_CHART_TYPE_DIM2;
  if (commands.length &&
    commands[0].syntax == visflow.nlp.Keyword.CHART_TYPE) {
    chartType = commands[0].token;
  }

  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN;
  var nodeX = box.left + box.width + margin;
  var nodeY = box.top;

  visflow.nlp.createNodes([
    {type: 'propertyEditor', x: nodeX, y: nodeY - margin},
    {type: 'union', x: nodeX, y: nodeY},
    {type: chartType, x: nodeX + margin, y: nodeY}
  ], function(nodes) {
    var editor = nodes[0];
    var union = nodes[1];
    var chart = nodes[2];
    visflow.flow.createEdge(target.getSelectionOutPort(),
      editor.getDataInPort());
    visflow.flow.createEdge(editor.getDataOutPort(), union.getDataInPort());
    visflow.flow.createEdge(union.getDataOutPort(), chart.getDataInPort());
    visflow.flow.createEdge(target.getDataOutPort(), union.getDataInPort());

    editor.setProperty('color', visflow.const.HIGHLIGHT_COLOR);
  });
};
