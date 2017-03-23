/**
 * Performs set operations based on NLP.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.set = function(commands) {
  var setType;
  switch (commands[0].token) {
    case visflow.nlp.Keyword.INTERSECT:
      setType = 'intersect';
      break;
    case visflow.nlp.Keyword.MINUS:
      setType = 'minus';
      break;
    case visflow.nlp.Keyword.UNION:
      setType = 'union';
      break;
  }
  _.popFront(commands);

  var operands = [];
  while (commands.length && commands[0].syntax == visflow.nlp.Keyword.NODE) {
    var operand = visflow.nlp.findNode({label: commands[0].token});
    if (operand != null) {
      operands.push(operand);
    }
    _.popFront(commands);
  }
  if (!operands.length) {
    visflow.error('cannot find node for set operation');
    return;
  }

  var box = visflow.nlp.target.getBoundingBox();
  var nodeX = box.left + box.width + visflow.nlp.DEFAULT_MARGIN_SMALL;
  var nodeY = box.top;

  visflow.nlp.createNodes([{
    type: setType,
    x: nodeX,
    y: nodeY
  }], function(nodes) {
    var set = _.first(nodes);

    if (operands.length == 1) {
      visflow.flow.createEdge(visflow.nlp.target.getDataOutPort(),
        set.getDataInPort());
      visflow.flow.createEdge(operands[0].getDataOutPort(),
        set.getSecondDataInPort());
    } else { // at least two operands
      visflow.flow.createEdge(operands[0].getDataOutPort(),
        set.getDataInPort());
      visflow.flow.createEdge(operands[1].getDataOutPort(),
        set.getSecondDataInPort());
    }
  });
};
