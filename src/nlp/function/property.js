/**
 * Creates rendering property setter from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 *     Commands should be pairs of (propery, value), e.g. "width 2 opacity .2".
 * @return {!Array<!visflow.Node>} The list of nodes created
 */
visflow.nlp.renderingProperty = function(commands) {
  var setProperties = {};
  var mapProperties = {};
  while (commands.length >= 2) {
    var property = commands[0].token;
    if (!visflow.nlp.isRenderingProperty(commands[0].token)) {
      console.error('unexpected rendering property', commands[0].token);
      return [];
    }
    commands = commands.slice(1);

    var value = commands[0].token;
    var needDim = false;
    if (visflow.nlp.isColorScale(value)) {
      mapProperties[property] = {value: value};
      commands = commands.slice(1);
      needDim = true;
    } else if (commands.length >= 2 && visflow.utils.isNumber(value) &&
      visflow.utils.isNumber(commands[1].token)) {
      // It is a value range, e.g. "size 2.0 3.0"
      mapProperties[property] = {value: [+value, +commands[1].token]};
      commands = commands.slice(2);
      needDim = true;
    } else {
      // a set property, e.g. "width 2.0"
      setProperties[property] = value;
      commands = commands.slice(1);
    }
    if (needDim) {
      if (!commands.length ||
        commands[0].syntax != visflow.nlp.Keyword.DIMENSION) {
        console.error('expecting dim after map property');
        return [];
      }
      mapProperties[property].dim = commands[0].token;
      commands = commands.slice(1);
    }
  }

  var target = visflow.nlp.target;
  if (target.IS_VISUALIZATION) {
    return visflow.nlp.renderingPropertyOnVisualization_(setProperties,
      mapProperties);
  }

  var specs = visflow.nlp.getNodeSpecsForRenderingProperties_(setProperties,
    mapProperties);

  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeX = box.left + box.width;
  var nodeY = box.top;
  specs.forEach(function(spec) {
    nodeX += margin;
    spec.x = nodeX;
    spec.y = nodeY;
  });

  return visflow.nlp.createNodes(specs, function(nodes) {
    var lastNode = target;
    nodes.forEach(function(node, index) {
      var spec = specs[index];
      visflow.flow.createEdge(lastNode.getDataOutPort(),
        node.getDataInPort());
      if (spec.type == 'propertyEditor') {
        node.setProperties(spec.properties);
      } else {
        node.setMapping(target.getDimensionNames().indexOf(spec.dim),
          spec.property, spec.value);
      }
      lastNode = node;
    });
  });
};

/**
 * Adds rendering property setters before the visualization.
 * @param {!Object<string, (number|string)>} setProperties
 * @param {!Object<string, {dim: string,
 *     value: (string|number|!Array<number>)}>} mapProperties
 * @return {!Array<!visflow.Node>} The list of nodes created
 * @private
 */
visflow.nlp.renderingPropertyOnVisualization_ = function(setProperties,
                                                         mapProperties) {
  var specs = visflow.nlp.getNodeSpecsForRenderingProperties_(setProperties,
    mapProperties);

  var target = visflow.nlp.target;
  var box = target.getBoundingBox();
  var margin = visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeX = box.left;
  var nodeY = box.top;

  specs.forEach(function(spec) {
    spec.x = nodeX;
    spec.y = nodeY;
    nodeX += margin;
  });

  return visflow.nlp.createNodes(specs, function(nodes) {
    var lastNode = null;
    nodes.forEach(function(node, index) {
      var spec = specs[index];
      if (lastNode) {
        visflow.flow.createEdge(lastNode.getDataOutPort(),
          node.getDataInPort());
      }
      if (spec.type == 'propertyEditor') {
        node.setProperties(spec.properties);
      } else {
        node.setMapping(target.getDimensionNames().indexOf(spec.dim),
          spec.property, spec.value);
      }
      lastNode = node;
    });

    var inPort = target.getDataInPort();
    var prevOutPort = inPort.connections.length ?
      inPort.connections[0].sourcePort : null;
    if (prevOutPort) {
      visflow.flow.deleteEdge(inPort.connections[0]);
      visflow.flow.createEdge(prevOutPort, nodes[0].getDataInPort());
    }
    visflow.flow.createEdge(lastNode.getDataOutPort(), inPort);
    target.moveTo(nodeX + margin, nodeY);
  });
};

/**
 * Creates node specifications for rendering properties.
 * @param {!Object<string, (number|string)>} setProperties
 * @param {!Object<string, {dim: string,
 *     value: (string|number|!Array<number>)}>} mapProperties
 * @return {!Array<!Object>} Node specification.
 * @private
 */
visflow.nlp.getNodeSpecsForRenderingProperties_ = function(setProperties,
                                                           mapProperties) {
  var target = visflow.nlp.target;
  var specs = [];
  if (!$.isEmptyObject(setProperties)) {
    if (target instanceof visflow.PropertyEditor) {
      // If the current target is already a property editor, we overwrite its
      // set properties and return immediately.
      target.setProperties(setProperties);
      return [target];
    } else {
      // For all setProperties we only create one property editor, as it can
      // set all properties altogether.
      specs.push({
        type: 'propertyEditor',
        properties: setProperties
      });
    }
  }
  if (!$.isEmptyObject(mapProperties)) {
    // For each mapping property we have to create one extra mapping node.
    // This is because one property mapping handles mapping on one dimension.
    for (var property in mapProperties) {
      specs.push({
        type: 'propertyMapping',
        property: property,
        value: mapProperties[property].value,
        dim: mapProperties[property].dim
      });
    }
  }
  return specs;
};
