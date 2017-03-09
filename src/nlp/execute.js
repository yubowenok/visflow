/** @enum {number} */
visflow.nlp.CommandType = {
  CHART: 0,
  CHART_FILTER: 1,
  HIGHLIGHT: 10,
  HIGHLIGHT_FILTER: 11,
  FILTER: 20,

  AUTOLAYOUT: 50,
  DELETE: 51,

  UNKNOWN: -1
};

/**
 * Default margin used when creating new node.
 * @private @const {number}
 */
visflow.nlp.DEFAULT_MARGIN_ = 150;

/**
 * Checks if a root command is a chart type.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isChartType_ = function(token) {
  return visflow.nlp.chartPrimitives().indexOf(token) != -1 ||
    token == visflow.nlp.CHART_TYPE_PLACEHOLDER;
};

/**
 * Checks if a root command is to highlight.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isHighlight_ = function(token) {
  return token == 'highlight';
};

/**
 * Checks if the root command is a util.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isUtil_ = function(token) {
  return visflow.nlp.utilPrimitives().indexOf(token) != -1;
};

/**
 * Gets the util command type from a token.
 * @param {string} token
 * @return {visflow.nlp.CommandType}
 * @private
 */
visflow.nlp.getUtilType_ = function(token) {
  switch (token) {
    case 'autolayout':
      return visflow.nlp.CommandType.AUTOLAYOUT;
    case 'delete':
      return visflow.nlp.CommandType.DELETE;
  }
  return visflow.nlp.CommandType.UNKNOWN;
};

/**
 * Checks what type a command is.
 * @param {string} command
 * @return {visflow.nlp.CommandType}
 * @private
 */
visflow.nlp.getCommandType_ = function(command) {
  var root = command.split(/\s+/)[0];
  if (visflow.nlp.isChartType_(root)) {
    return visflow.nlp.CommandType.CHART;
  } else if (visflow.nlp.isHighlight_(root)) {
    return visflow.nlp.CommandType.HIGHLIGHT;
  } else if (visflow.nlp.isUtil_(root)) {
    return visflow.nlp.getUtilType_(root);
  }
  return visflow.nlp.CommandType.UNKNOWN;
};

/**
 * Executes an NLP command.
 * @param {string} command Command with placeholders remapped.
 * @param {string} syntax Parsed structure of the command.
 */
visflow.nlp.execute = function(command, syntax) {
  var type = visflow.nlp.getCommandType_(command);
  var commandTokens = command.split(/\s+/);
  var syntaxTokens = syntax.split(/\s+/);
  var commands = [];
  for (var i = 0; i < commandTokens.length; i++) {
    commands.push({token: commandTokens[i], syntax: syntaxTokens[i]});
  }
  switch (type) {
    case visflow.nlp.CommandType.CHART:
    case visflow.nlp.CommandType.CHART_FILTER:
      visflow.nlp.chart_(commands);
      break;
    case visflow.nlp.CommandType.HIGHLIGHT:
    case visflow.nlp.CommandType.HIGHLIGHT_FILTER:
      visflow.nlp.highlight_(commands);
      break;
    case visflow.nlp.CommandType.FILTER:
      visflow.nlp.filter_(commands);
      break;
    case visflow.nlp.CommandType.AUTOLAYOUT:
      visflow.flow.autoLayoutAll();
      break;
  }
};

/**
 * Batch creates a list of nodes at given positions, and adjusts their layout
 * once done.
 * @param {!Array<{type: string, x: number, y: number}>} nodeInfo
 * @param {Function=} callback
 * @private
 */
visflow.nlp.createNodes_ = function(nodeInfo, callback) {
  var readyCounter = nodeInfo.length;
  var nodes = [];
  var movable = {};

  nodeInfo.forEach(function(info) {
    var node = visflow.flow.createNode(info.type);
    nodes.push(node);

    var newMovable = visflow.flow.nearbyNodes(info.x, info.y);
    _.extend(movable, newMovable);

    $(node).on('vf.ready', function() {
      node.moveTo(info.x, info.y);
      if (--readyCounter == 0 && callback) {
        callback(nodes);
        visflow.flow.autoLayout(movable);
      }
    });
  });
};

/**
 * Creates chart from NLP command.
 * @param {!Array<{token: string, syntax: string}>} commands
 * @private
 */
visflow.nlp.chart_ = function(commands) {
  var target = visflow.nlp.target;
  // By default using scatterplot, may be TODO
  var chartType = commands[0].token == visflow.nlp.CHART_TYPE_PLACEHOLDER ?
    'scatterplot' : commands[0].token;

  var box = target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN_;
  var nodeY = box.top;

  var dims = [];
  for (var j = 1; j < commands.length &&
  commands[j].syntax == visflow.nlp.DIMENSION_PLACEHOLDER; j++) {
    dims.push(commands[j].token);
  }

  visflow.nlp.createNodes_([
    {type: chartType, x: nodeX, y: nodeY}
  ], function(nodes) {
    var chart = nodes[0];
    visflow.flow.createEdge(target.getDataOutPort(), chart.getDataInPort());
    if (dims.length) {
      chart.setDimensions(dims);
    }
  });
};

/**
 * Expands diagram for highlighting from NLP command.
 * @param {!Array<{token: string, syntax: string}>} commands
 * @private
 */
visflow.nlp.highlight_ = function(commands) {
  if (commands[0].token != 'highlight' || commands[1].token != 'selection') {
    console.error('unexpected highlight command');
    return;
  }
  commands = commands.slice(2);

  var fromNode = visflow.nlp.target;
  if (commands.length && commands[0].token == 'of') {
    if (!commands[0] ||
        commands[1].syntax != visflow.nlp.CHART_TYPE_PLACEHOLDER) {
      console.error('unexpected highlight source');
      return;
    }
    // Try to find the user's current focus, and highlight from there.
    if (!fromNode.matchType(commands[1].token)) {
      visflow.nlp.target = visflow.flow.closestNodeToMouse({
        nodeName: commands[1].token
      });
    }
    commands = commands.slice(2);
  }
  var target = /** @type {visflow.Visualization} */(visflow.nlp.target);
  if (!target.IS_VISUALIZATION) {
    visflow.error('node does not have selection to be highlighted');
    return;
  }

  var chartType = 'scatterplot';
  if (commands.length &&
    commands[0].syntax == visflow.nlp.CHART_TYPE_PLACEHOLDER) {
    chartType = commands[0].token;
  }

  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN_;
  var nodeX = box.left + box.width + margin;
  var nodeY = box.top;

  visflow.nlp.createNodes_([
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

    editor.setProperty('color', visflow.const.THEME_COLOR_LIGHT);
  });
};

/**
 * Creates filter from NLP command.
 * @param {!Array<{token: string, syntax: string}>} commands
 * @private
 */
visflow.nlp.filter_ = function(commands) {

};
