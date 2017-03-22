/**
 * Creates chart from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.chart = function(commands) {
  var target = visflow.nlp.target;
  var chartType = commands[0].token;

  commands = commands.slice(1);

  // Check if it is selection
  var isSelection = false;
  if (commands.length && commands[0].token == visflow.nlp.Keyword.SELECTION) {
    isSelection = true;
    commands = commands.slice(1);
    if (!target.IS_VISUALIZATION) {
      visflow.error('node does not have selection to be highlighted');
      return;
    }
  }

  // Check if there is filter
  var filter = null;
  if (commands.length && commands[0].token == visflow.nlp.Keyword.FILTER) {
    var splitCommands = visflow.nlp.retrieveFilters(commands);
    filter = _.first(visflow.nlp.filter(splitCommands.filters, true));
    commands = splitCommands.remaining;
  }

  var dims = [];
  for (var j = 0; j < commands.length &&
  commands[j].syntax == visflow.nlp.Keyword.DIMENSION; j++) {
    dims.push(commands[j].token);
  }

  // Apply default chart types.
  if (chartType == visflow.nlp.Keyword.CHART_TYPE) {
    if (dims.length == 1) {
      chartType = visflow.nlp.DEFAULT_CHART_TYPE_DIM1;
    } else if (dims.length == 2) {
      chartType = visflow.nlp.DEFAULT_CHART_TYPE_DIM2;
    } else {
      chartType = visflow.nlp.DEFAULT_CHART_TYPE_DIMS;
    }
  }

  var box = target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN;
  var nodeY = box.top;

  visflow.nlp.createNodes([
    {type: chartType, x: nodeX, y: nodeY}
  ], function(nodes) {
    var chart = nodes[0];
    var outPort = !isSelection ? target.getDataOutPort() :
      target.getSelectionOutPort();
    var inPort = !filter ? chart.getDataInPort() : filter.getDataInPort();
    visflow.flow.createEdge(outPort, inPort);
    if (filter) {
      visflow.flow.createEdge(filter.getDataOutPort(), chart.getDataInPort());
    }
    if (dims.length) {
      chart.setDimensions(dims);
    }
  });
};
