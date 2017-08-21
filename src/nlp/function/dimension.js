/**
 * Retrieves the list of dimensions in the command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 * @return {{
 *   dimensions: !Array<visflow.nlp.CommandToken>,
 *   remaining: !Array<visflow.nlp.CommandToken>
 * }}
 */
visflow.nlp.retrieveDimensions = function(commands) {
  var dimensions = [];
  while (commands.length &&
    commands[0].syntax == visflow.nlp.Keyword.DIMENSION) {

    dimensions.push(commands[0]);
    _.popFront(commands);
  }
  return {
    dimensions: dimensions,
    remaining: commands
  };
};
