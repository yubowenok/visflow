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
  return visflow.nlp.chartTypes_().indexOf(token) != -1 ||
    token == visflow.nlp.CHART_TYPE_PLACEHOLDER_;
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
  return visflow.nlp.utilTypes_().indexOf(token) != -1;
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
 * @private
 */
visflow.nlp.execute_ = function(command, syntax) {
  var type = visflow.nlp.getCommandType_(command);
  var commandTokens = command.split(/\s+/);
  var syntaxTokens = syntax.split(/\s+/);
  switch (type) {
    case visflow.nlp.CommandType.CHART:
    case visflow.nlp.CommandType.CHART_FILTER:
      visflow.nlp.chart_(commandTokens, syntaxTokens);
      break;
    case visflow.nlp.CommandType.HIGHLIGHT:
    case visflow.nlp.CommandType.HIGHLIGHT_FILTER:
      visflow.nlp.highlight_(command);
      break;
    case visflow.nlp.CommandType.FILTER:
      visflow.nlp.filter_(command);
      break;
    case visflow.nlp.CommandType.AUTOLAYOUT:
      visflow.flow.autoLayoutAll();
      break;
  }
};

/**
 * Creates chart from NLP command.
 * @param {!Array<string>} command
 * @param {!Array<string>} syntax
 * @private
 */
visflow.nlp.chart_ = function(command, syntax) {
  var target = visflow.nlp.target;
  var chartType = command[0] == visflow.nlp.CHART_TYPE_PLACEHOLDER_ ?
    'scatterplot' : command[0]; // By default using scatterplot, may be TODO
  var node = visflow.flow.createNode(chartType);
  var box = target.getBoundingBox();
  $(node).on('vf.ready', function() {
    node.moveTo(
      box.left + box.width + visflow.nlp.DEFAULT_MARGIN_,
      box.top
    );
    var outPort = target.getPort('out');
    var inPort = node.getPort('in');
    visflow.flow.createEdge(outPort, inPort);
    var movable = {};
    movable[node.id] = true;
    movable[target.id] = true;
    visflow.flow.autoLayout(movable);

    var dims = [];
    for (var j = 1; j < syntax.length &&
        syntax[j] == visflow.nlp.DIMENSION_PLACEHOLDER_; j++) {
      dims.push(command[j]);
    }
    if (dims.length) {
      node.setDimensions(dims);
    }
  });

};

/**
 * Expands diagram for highlighting from NLP command.
 * @param {string} command
 * @private
 */
visflow.nlp.highlight_ = function(command) {

};

/**
 * Creates filter from NLP command.
 * @param {string} command
 * @private
 */
visflow.nlp.filter_ = function(command) {

};
