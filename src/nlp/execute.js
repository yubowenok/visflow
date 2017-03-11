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

/** @typedef {{token: string, syntax: string}} */
visflow.nlp.CommandToken;

/**
 * Checks what type a command is.
 * @param {string} command
 * @return {visflow.nlp.CommandType}
 * @private
 */
visflow.nlp.getCommandType_ = function(command) {
  var root = command.split(/\s+/)[0];
  switch (true) {
    case visflow.nlp.isChartType(root):
      return visflow.nlp.CommandType.CHART;
    case visflow.nlp.isHighlight(root):
      return visflow.nlp.CommandType.HIGHLIGHT;
    case visflow.nlp.isFilter(root):
      return visflow.nlp.CommandType.FILTER;
    case visflow.nlp.isUtil(root):
      return visflow.nlp.getUtilType(root);
    default:
      return visflow.nlp.CommandType.UNKNOWN;
  }
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
 * @return {!Array<!visflow.Node>} Nodes created. This is used for cross-type
 *     node creations and their post linkings.
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
  return nodes;
};

/**
 * Retrieves the sequence of filters at the beginning of the commands.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @return {{
 *   filters: !Array<visflow.nlp.CommandToken>,
 *   remaining: !Array<visflow.nlp.CommandToken>
 * }}
 * @private
 */
visflow.nlp.retrieveFilters_ = function(commands) {
  if (commands[0].token != visflow.nlp.Keyword.FILTER) {
    console.error('not a filter command');
    return {filters: [], remaining: []};
  }
  var filters = [commands[0]];
  commands = commands.slice(1);
  while (commands.length &&
    commands[0].syntax == visflow.nlp.Keyword.DIMENSION) {

    filters.push(commands[0]);
    commands = commands.slice(1);

    // More condition on the current dimension
    while (commands.length >= 2 &&
      (visflow.nlp.isComparison(commands[1].token) ||
      visflow.nlp.isMatch(commands[1].token))) {
      filters = filters.concat(commands.slice(0, 2));
      commands = commands.slice(2);
    }
  }
  return {
    filters: filters,
    remaining: commands
  };
};

/**
 * Creates chart from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @private
 */
visflow.nlp.chart_ = function(commands) {
  var target = visflow.nlp.target;
  // By default using scatterplot, may be TODO
  var chartType = commands[0].token == visflow.nlp.Keyword.CHART_TYPE ?
    'scatterplot' : commands[0].token;

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
    var splitCommands = visflow.nlp.retrieveFilters_(commands);
    filter = visflow.nlp.filter_(splitCommands.filters)[0];
    commands = splitCommands.remaining;
    target = filter;
  }

  var dims = [];
  for (var j = 0; j < commands.length &&
  commands[j].syntax == visflow.nlp.Keyword.DIMENSION; j++) {
    dims.push(commands[j].token);
  }

  var box = target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN_;
  var nodeY = box.top;

  visflow.nlp.createNodes_([
    {type: chartType, x: nodeX, y: nodeY}
  ], function(nodes) {
    var chart = nodes[0];
    if (!isSelection) {
      visflow.flow.createEdge(target.getDataOutPort(), chart.getDataInPort());
    } else {
      visflow.flow.createEdge(target.getSelectionOutPort(),
        chart.getDataInPort());
    }
    if (dims.length) {
      chart.setDimensions(dims);
    }
  });
};

/**
 * Expands diagram for highlighting from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @private
 */
visflow.nlp.highlight_ = function(commands) {
  if (commands[0].token != visflow.nlp.Keyword.HIGHLIGHT ||
      commands[1].token != visflow.nlp.Keyword.SELECTION) {
    console.error('unexpected highlight command');
    return;
  }
  commands = commands.slice(2);

  var fromNode = visflow.nlp.target;
  if (commands.length && commands[0].token == 'of') {
    if (!commands[0] ||
        commands[1].syntax != visflow.nlp.Keyword.CHART_TYPE) {
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
    commands[0].syntax == visflow.nlp.Keyword.CHART_TYPE) {
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
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @return {!Array<!visflow.Node>} The list of nodes created
 * @private
 */
visflow.nlp.filter_ = function(commands) {
  if (commands[0].token != visflow.nlp.Keyword.FILTER) {
    console.error('unexpected filter command');
    return [];
  }
  commands = commands.slice(1);

  var target = visflow.nlp.target;

  /**
   * List of dimension information. Each filter imposes constraint on one
   * dimension. Multiple filters acting together should be handled by multiple
   * filter nodes.
   * @type {!Array<{
   *   dim: number,
   *   range: (Array<number>|undefined),
   *   value: (string|undefined)
   * }>}
   */
  var dimInfo = [];
  while (commands.length) {
    var dim = commands[0].token;
    if (commands[0].syntax != visflow.nlp.Keyword.DIMENSION) {
      console.error('unexpected dimension');
      return [];
    }
    var info = {
      dim: target.getDimensionNames().indexOf(dim),
      range: [-Infinity, Infinity],
      value: undefined
    };

    // Remove filter keyword
    commands = commands.slice(1);

    while (commands.length >= 2) {
      var isRangeFilter = false;
      var isValueFilter = false;
      if (visflow.nlp.isComparison(commands[0].token)) {
        isRangeFilter = true;
      } else if (visflow.nlp.isMatch(commands[0].token)) {
        isValueFilter = true;
      } else {
        // something like "dim >= 2 <= 3 [dim] >= 2"
        // It means a new constraint or a trailing command has started.
        // Therefore we break immediately.
        break;
      }
      if (isRangeFilter && isValueFilter) {
        console.warn('both range and match filter?');
      }
      if (isRangeFilter) {
        var sign = commands[0].token;
        var value = commands[1].token;
        if (visflow.utils.isNumber(value)) {
          value = +value;
        }
        if (sign == '<' || sign == '<=') {
          info.range[1] = info.range[1] < value ? info.range[1] : value;
        } else if (sign == '>' || sign == '>=') {
          info.range[0] = info.range[0] > value ? info.range[0] : value;
        } else if (sign == '=') {
          info.range[0] = info.range[1] = value;
        }
      }
      if (isValueFilter) {
        info.value = commands[2].token;
      }
      commands = commands.slice(2);
    }

    dimInfo.push(info);
  }

  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN_ / 2; // half margin for smaller node
  var nodeX = box.left + box.width;
  var nodeY = box.top;

  var nodesSpec = dimInfo.map(function(info, index) {
    nodeX += margin;
    return {
      dim: info.dim,
      type: info.value !== undefined ? 'value' : 'range',
      x: nodeX + margin * (index + 1),
      y: nodeY,
      range: info.range,
      value: info.value
    };
  });
  return visflow.nlp.createNodes_(nodesSpec, function(filters) {
    var lastNode = target;
    filters.forEach(function(filter, index) {
      var spec = nodesSpec[index];
      visflow.flow.createEdge(lastNode.getDataOutPort(),
        filter.getDataInPort());
      if (spec.value !== undefined) {
        filter.setValue(spec.dim, spec.value);
      } else {
        filter.setRange(spec.dim,
          spec.range[0] == -Infinity ? null : spec.range[0],
          spec.range[1] == Infinity ? null : spec.range[1]);
      }
      lastNode = filter;
    });
  });
};
