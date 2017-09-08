/**
 * Creates a value extractor to retrieve column values.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.extract = function(commands) {
  if (!commands.length || commands[0].token != visflow.nlp.Keyword.EXTRACT) {
    console.error('unexpected extract command');
    return;
  }
  var target = visflow.nlp.target;
  if (target == null) {
    visflow.error('no node target to extract values from');
    return;
  }
  _.popFront(commands);

  var isSelection = commands.length &&
    commands[0].token == visflow.nlp.Keyword.SELECTION;
  if (isSelection) {
    _.popFront(commands);
    if (!target.IS_VISUALIZATION) {
      visflow.error('only visualizations have selection to be extracted');
      return;
    }
  }

  var dims = visflow.nlp.retrieveDimensions(commands).dimensions.map(
    function(dimCommand) {
      return target.getDimensionNames().indexOf(dimCommand.token);
    });

  var box = target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeY = box.top;

  visflow.nlp.createNodes([{
    type: 'valueExtractor',
    x: nodeX,
    y: nodeY
  }], function(nodes) {
    /** @type {!visflow.ValueExtractor} */
    var extractor = _.first(nodes);
    var outPort = isSelection ? target.getSelectionOutPort() :
      target.getDataOutPort();
    visflow.flow.createEdge(outPort, extractor.getDataInPort());
    extractor.setDimensions(dims);
  });
};


/**
 * Links the output of the current target to the nearby value extractor.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.link = function(commands) {
  if (!commands.length || commands[0].token != visflow.nlp.Keyword.LINK) {
    console.error('unexpected link command');
    return;
  }
  _.popFront(commands);

  var target = visflow.nlp.target;
  if (target == null) {
    visflow.error('no target to link');
    return;
  }

  var isHighlight = commands.length && commands[0].token ==
    visflow.nlp.Keyword.HIGHLIGHT;
  if (isHighlight) {
    _.popFront(commands);
  }

  var remains = visflow.nlp.retrieveDimensions(commands);
  var dimNames = remains.dimensions.map(function(command) {
    return command.token;
  });

  if (dimNames.length > 1) {
    visflow.warning('cannot link multiple dimensions, applying the first');
  }
  commands = remains.remaining;

  var from = null;
  if (commands.length && commands[0].token == visflow.nlp.Keyword.FROM) {
    if (commands[1].syntax == visflow.nlp.Keyword.CHART_TYPE) {
      from = visflow.nlp.findNode({type: commands[1].token});
    } else { // visflow.nlp.Keyword.NODE
      from = visflow.nlp.findNode({label: commands[1].token});
    }
    _.popFront(commands, 2);
  }

  var nodeSpecs = [];
  var box = target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeY = box.top;

  /** @type {?visflow.ValueExtractor} */
  var extractor = null;

  var createExtractor = false;

  if (from == null) {
    // Search for nearby value extractors.
    extractor = /** @type {!visflow.ValueExtractor} */(visflow.flow
      .closestNodeToMouse({type: 'valueExtractor'}));
    if (extractor == null) {
      // Find the closest node with a different data set.
      // Linking typically happens between heterogeneous data.
      from = visflow.flow.closestNodeToMouse({
        differentData: target.getDataOutPort().pack.data.dataId
      });
      if (from == null) {
        from = visflow.flow.closestNodeToMouse({
          differentNode: target.id
        });
      }
      if (from == null) {
        visflow.error('cannot find a node to link from');
        return;
      }
    }
  } else {
    // From is given. If it is a visualization, then we get selection port.
    // Otherwise we get data port.
    var outPort = from.IS_VISUALIZATION ? from.getSelectionOutPort() :
      from.getDataOutPort();
    extractor = visflow.nlp.findValueExtractor_(outPort);
    if (extractor == null && from.IS_VISUALIZATION) {
      // Also search for output port
      extractor = visflow.nlp.findValueExtractor_(from.getDataOutPort());
    }
  }

  if (extractor == null) {
    createExtractor = true;
    nodeSpecs.push({
      type: 'valueExtractor',
      x: nodeX,
      y: nodeY - visflow.nlp.DEFAULT_MARGIN_SMALL
    });
  }

  // Add filter
  nodeX += visflow.nlp.DEFAULT_MARGIN_SMALL;
  nodeSpecs.push({
    type: 'value',
    x: nodeX,
    y: nodeY
  });

  if (isHighlight) {
    nodeX += visflow.nlp.DEFAULT_MARGIN_SMALL;
    nodeSpecs.push({
      type: 'propertyEditor',
      x: nodeX,
      y: nodeY
    });
    nodeX += visflow.nlp.DEFAULT_MARGIN_SMALL;
    nodeSpecs.push({
      type: 'union',
      x: nodeX,
      y: nodeY
    });
  }

  var hasFinalTarget = commands.length && commands[0].syntax ==
    visflow.nlp.Keyword.TO;
  var finalTarget = null;
  if (hasFinalTarget) {
    if (commands[1].syntax == visflow.nlp.Keyword.CHART_TYPE) {
      nodeSpecs.push({
        type: commands[1].token,
        x: nodeX + visflow.nlp.DEFAULT_MARGIN,
        y: nodeY
      });
    } else if (commands[1].syntax == visflow.nlp.Keyword.NODE) {
      finalTarget = visflow.nlp.findNode({label: commands[1].token});
    } else {
      visflow.error('unexpected link target');
      return;
    }
  }

  visflow.nlp.createNodes(nodeSpecs, function(nodes) {
    if (createExtractor) {
      extractor = _.popFront(nodes);
      // If the extractor is newly created, then we need to connect it with
      // "from" node.
      var outPort = from.IS_VISUALIZATION ? from.getSelectionOutPort() :
        from.getDataOutPort();
      visflow.flow.createEdge(outPort, extractor.getDataInPort());

      extractor.setDimensions([
        from.getDimensionNames().indexOf(dimNames[0])
      ]);
    }

    /** @type {!visflow.ValueFilter} */
    var filter = _.popFront(nodes);
    visflow.flow.createEdge(extractor.getConstantOutPort(),
      filter.getConstantInPort());

    filter.setDimension(target.getDimensionNames().indexOf(dimNames[0]));

    // Connect target to filter
    visflow.flow.createEdge(target.getDataOutPort(), filter.getDataInPort());

    if (isHighlight) {
      var editor = _.popFront(nodes);
      var union = _.popFront(nodes);

      visflow.flow.createEdge(filter.getDataOutPort(), editor.getDataInPort());
      visflow.flow.createEdge(editor.getDataOutPort(), union.getDataInPort());
      visflow.flow.createEdge(target.getDataOutPort(), union.getDataInPort());

      editor.setProperty('color', visflow.const.HIGHLIGHT_COLOR);
    }

    if (hasFinalTarget) {
      finalTarget = finalTarget ? finalTarget : _.popFront(nodes);
      visflow.flow.createEdge(union.getDataOutPort(),
        finalTarget.getDataInPort());
    }
  });
};

/**
 * Finds a value extractor from the incident nodes of the port.
 * @param {!visflow.SubsetPort} port
 * @return {?visflow.ValueExtractor}
 * @private
 */
visflow.nlp.findValueExtractor_ = function(port) {
  var connections = port.connections;
  for (var i = 0; i < connections.length; i++) {
    var edge = connections[i];
    if (edge.targetNode.matchType('valueExtractor')) {
      return /** @type {!visflow.ValueExtractor} */(edge.targetNode);
    }
  }
  return null;
};
