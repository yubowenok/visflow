/**
 * Retrieves the sequence of filters at the beginning of the commands.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @return {{
 *   filters: !Array<visflow.nlp.CommandToken>,
 *   remaining: !Array<visflow.nlp.CommandToken>
 * }}
 */
visflow.nlp.retrieveFilters = function(commands) {
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
    (visflow.nlp.isComparison(commands[0].token) ||
    visflow.nlp.isContain(commands[0].token))) {
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
 * Parses a list of filtering commands. Each filter imposes constraint on one
 * dimension. Multiple filters acting together should be handled by multiple
 * filter nodes.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @return {!Array<visflow.Filter.Spec>}
 */
visflow.nlp.parseFilters = function(commands) {
  var filterSpecs = [];

  while (commands.length) {
    if (commands[0].syntax != visflow.nlp.Keyword.DIMENSION &&
      commands[0].token != visflow.nlp.Keyword.INDEX) {
      console.error('unexpected dimension');
      return [];
    }

    var dim = commands[0].token == visflow.nlp.Keyword.INDEX ?
      visflow.data.INDEX_DIM :
      visflow.nlp.target.getDimensionNames().indexOf(commands[0].token);
    // Remove dimension
    commands = commands.slice(1);

    var useRangeFilter = false;
    var useValueFilter = false;
    var useSampler = false;
    var rangeSpec = {
      type: 'range',
      dim: dim,
      range: [-Infinity, Infinity]
    };
    var valueSpec = {
      type: 'value',
      dim: dim,
      value: undefined,
      target: undefined // target for value filter
    };
    var samplerSpec = {
      type: 'sampler',
      dim: dim,
      number: visflow.nlp.DEFAULT_SAMPLER_NUMBER
    };

    while (commands.length) {
      var isRangeFilter = false;
      var isValueFilter = false;
      var isSampler = false;
      if (visflow.nlp.isComparison(commands[0].token)) {
        if (!visflow.utils.isNumber(commands[1].token) &&
          commands[0].token == '=') {
          // If the value is a string, then use value filter with FULL match
          // for equal comparison.
          isValueFilter = true;
          valueSpec.target = visflow.ValueFilter.Target.FULL;
        } else {
          isRangeFilter = true;
        }
      } else if (visflow.nlp.isContain(commands[0].token)) {
        isValueFilter = true;
      } else if (visflow.nlp.isSampler(commands[0].token)) {
        // min max or random
        isSampler = true;
      } else {
        // something like "dim >= 2 <= 3 [dim] >= 2"
        // It means a new constraint or a trailing command has started.
        // Therefore we break immediately.
        break;
      }
      if (isRangeFilter + isValueFilter + isSampler > 1) {
        console.error('multiple filter types accepted');
      }
      if (isRangeFilter) {
        var sign = commands[0].token;
        var value = commands[1].token;
        if (visflow.utils.isNumber(value)) {
          value = +value;
        }
        if (sign == '<' || sign == '<=') {
          rangeSpec.range[1] = rangeSpec.range[1] < value ?
            rangeSpec.range[1] : value;
        } else if (sign == '>' || sign == '>=') {
          rangeSpec.range[0] = rangeSpec.range[0] > value ?
            rangeSpec.range[0] : value;
        } else if (sign == '=') {
          rangeSpec.range[0] = rangeSpec.range[1] = value;
        }
        useRangeFilter = true;
        _.popFront(commands, 2);
      } else if (isValueFilter) {
        valueSpec.value = commands[1].token;
        useValueFilter = true;
        _.popFront(commands, 2);
      } else if (isSampler) {
        var condition = commands[0].token;
        if (condition == visflow.nlp.Keyword.MIN) {
          samplerSpec.condition = visflow.Sampler.Condition.FIRST;
        } else if (condition == visflow.nlp.Keyword.MAX) {
          samplerSpec.condition = visflow.Sampler.Condition.LAST;
        } else if (condition == visflow.nlp.Keyword.RANDOM) {
          samplerSpec.condition = visflow.Sampler.Condition.SAMPLING;
        } else {
          console.error('unrecognized sampler condition');
        }
        _.popFront(commands);

        if (commands.length && visflow.utils.isNumber(commands[0].token)) {
          // Note that if there is no number, then the default value is applied.
          samplerSpec.number = commands[0].token;
          _.popFront(commands);
        }

        if (commands.length &&
          (commands[0].token == visflow.nlp.Keyword.PERCENT ||
           commands[0].token == visflow.nlp.Keyword.PERCENT_SIGN)) {
          samplerSpec.mode = visflow.Sampler.Mode.PERCENTAGE;
          _.popFront(commands);
        } else {
          samplerSpec.mode = visflow.Sampler.Mode.COUNT;
        }

        if (commands.length &&
          commands[0].syntax == visflow.nlp.Keyword.DIMENSION) {
          samplerSpec.groupBy = visflow.nlp.target.getDimensionNames()
            .indexOf(commands[0].token);
          _.popFront(commands);
        }
        useSampler = true;
      }
    }
    if (useRangeFilter) {
      filterSpecs.push(rangeSpec);
    }
    if (useValueFilter) {
      filterSpecs.push(valueSpec);
    }
    if (useSampler) {
      filterSpecs.push(samplerSpec);
    }
  }
  return filterSpecs;
};


/**
 * Creates filter from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @param {boolean=} opt_noPlacement If set, create no edges and arrange on the
 *     right of the target.
 * @return {!Array<!visflow.Node>} The list of nodes created
 */
visflow.nlp.filter = function(commands, opt_noPlacement) {
  if (commands[0].token != visflow.nlp.Keyword.FILTER &&
    commands[0].token != visflow.nlp.Keyword.FIND) {
    console.error('unexpected filter command');
    return [];
  }
  var isFind = commands[0].token == visflow.nlp.Keyword.FIND;
  commands = commands.slice(1);

  var noPlacement = !!opt_noPlacement;
  var target = visflow.nlp.target;

  var isSelection = commands.length &&
    commands[0].token == visflow.nlp.Keyword.SELECTION &&
    target.IS_VISUALIZATION;
  if (isSelection) {
    commands = commands.slice(1);
  }

  var filterSpecs = visflow.nlp.parseFilters(commands);

  // If the node is visualization and we are filtering, then apply filter to the
  // current visualization.
  var connectUpflow = !isFind && target.IS_VISUALIZATION && !noPlacement &&
    !isSelection;
  // Apply filter to all the downflow nodes if the mode is not to find.
  // Note that it is possible both connectUpflow and connectDownflow are false,
  // in which case the node performs a "find" expansion, and we only create
  // a list of filters after it.
  var connectDownflow = !connectUpflow && !isFind;

  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeX = box.left + (connectUpflow ? 0 : box.width);
  var nodeY = box.top;

  var nodeSpecs = filterSpecs.map(function(spec) {
    nodeX += connectUpflow ? -margin : margin;
    var nodeSpec = {
      x: nodeX,
      y: nodeY
    };
    _.extend(nodeSpec, spec);
    return nodeSpec;
  });

  var downflowInPorts = [];
  var upflowOutPorts = [];
  if (connectUpflow) {
    upflowOutPorts = visflow.flow.disconnectPort(target.getDataInPort());
  } else if (connectDownflow) {
    downflowInPorts = visflow.flow.disconnectPort(target.getDataOutPort());
  }

  return visflow.nlp.createNodes(nodeSpecs, function(filters) {
    filters.forEach(function(filter, index) {
      if (index > 0) {
        // Chain the filters
        visflow.flow.createEdge(filters[index - 1].getDataOutPort(),
          filter.getDataInPort());
      }
    });
    if (connectUpflow) {
      // Connect upflow nodes to the first filter
      upflowOutPorts.forEach(function(port) {
        visflow.flow.createEdge(port, _.first(filters).getDataInPort());
      });
      // Connect last filter to the target
      visflow.flow.createEdge(_.last(filters).getDataOutPort(),
        target.getDataInPort());
    }
    if (connectDownflow) {
      // Connect
      var filterOut = _.last(filters).getDataOutPort();
      downflowInPorts.forEach(function(port) {
        visflow.flow.createEdge(filterOut, port);
      });
    }
    if (!connectUpflow && !noPlacement) {
      // If not connected to upflow, then usually target should be connected
      // to the visualization, unless noPlacement is set and the connections
      // are managed at outer layer.
      var outPort = isSelection ? target.getSelectionOutPort() :
        target.getDataOutPort();
      visflow.flow.createEdge(outPort,
        _.first(filters).getDataInPort());
    }
    // Apply filter parameters once all connections are established.
    // Otherwise values may fail to load.
    filters.forEach(function(filter, index) {
      var spec = nodeSpecs[index];
      if (spec.type == 'value') {
        /** @type {!visflow.ValueFilter} */(filter).setValue(spec.dim,
          spec.value, spec.target);
      } else if (spec.type == 'range') {
        /** @type {!visflow.RangeFilter} */(filter).setRange(spec.dim,
          spec.range[0] == -Infinity ? null : spec.range[0],
          spec.range[1] == Infinity ? null : spec.range[1]);
      } else if (spec.type == 'sampler') {
        /** @type {!visflow.Sampler} */(filter).setSpec(spec);
      } else {
        console.error('unknown filter type');
      }
    });
  });
};
