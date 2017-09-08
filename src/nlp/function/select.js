/**
 * Expands diagram for highlighting from NLP command.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.select = function(commands) {
  if (commands[0].token != visflow.nlp.Keyword.SELECT) {
    console.error('unexpected select command');
    return;
  }
  _.popFront(commands);

  if (visflow.nlp.target == null || !visflow.nlp.target.IS_VISUALIZATION) {
    visflow.error('can only make selection in a visualization');
    return;
  }

  var filterSpecs = visflow.nlp.parseFilters(commands);
  var pack = new visflow.Subset().copy(/** @type {!visflow.Subset} */(
    visflow.nlp.target.getDataInPort().pack));
  filterSpecs.forEach(function(spec) {
    var result = [];
    switch (spec.type) {
      case 'range':
        result = visflow.RangeFilter.filter(
          /** @type {visflow.RangeFilter.Spec} */(spec), pack);
        break;
      case 'value':
        result = visflow.ValueFilter.filter(
          /** @type {visflow.ValueFilter.Spec} */(spec), pack);
        break;
      case 'sampler':
        result = visflow.Sampler.filter(
          /** @type {visflow.Sampler.Spec} */(spec), pack);
        break;
    }
    pack.filter(result);
  });
  visflow.nlp.target.select(pack.items);
};
