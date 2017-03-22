/**
 * @fileoverview Sampler defs.
 */

/** @inheritDoc */
visflow.Sampler.prototype.TEMPLATE =
  './dist/html/filter/sampler/sampler.html';
/** @inheritDoc */
visflow.Sampler.prototype.PANEL_TEMPLATE =
  './dist/html/filter/sampler/sampler-panel.html';
/** @inheritDoc */
visflow.Sampler.prototype.DEFAULT_LABEL = 'Filter';
/** @inheritDoc */
visflow.Sampler.prototype.NODE_CLASS = 'sampler';

/** @inheritDoc */
visflow.Sampler.prototype.MAX_HEIGHT = 43;
/** @inheritDoc */
visflow.Sampler.prototype.MIN_HEIGHT = 43;

/** @enum {string} */
visflow.Sampler.Condition = {
  FIRST: 'first',
  LAST: 'last',
  SAMPLING: 'sampling'
};

/** @enum {string} */
visflow.Sampler.Mode = {
  COUNT: 'count',
  PERCENTAGE: 'percentage'
};

/**
 * Condition for sampling.
 * @return {!Array<{id: string, text: string}>}
 * @protected
 */
visflow.Sampler.prototype.conditions = function() {
  return [
    {id: visflow.Sampler.Condition.FIRST, text: 'First / Minimum'},
    {id: visflow.Sampler.Condition.LAST, text: 'Last / Maximum'},
    {id: visflow.Sampler.Condition.SAMPLING, text: 'Random Sampling'}
  ];
};

/**
 * Modes for band limiting.
 * @return {!Array<{id: string, text: string}>}
 * @protected
 */
visflow.Sampler.prototype.modes = function() {
  return [
    {id: visflow.Sampler.Mode.COUNT, text: 'Count'},
    {id: visflow.Sampler.Mode.PERCENTAGE, text: 'Percentage'}
  ];
};

/**
 * @typedef {{
 *   dim: number,
 *   groupBy: (number|string),
 *   number: number,
 *   unique: (boolean|undefined),
 *   condition: visflow.Sampler.Condition,
 *   mode: visflow.Sampler.Mode
 * }}
 */
visflow.Sampler.Spec;

/** @inheritDoc */
visflow.Sampler.prototype.defaultOptions = function() {
  return new visflow.options.Sampler({
    // Dimension to be filtered on.
    dim: 0,
    // Filtering conditions, 'first', 'last' or 'sampling'.
    condition: visflow.Sampler.Condition.FIRST,
    // Filtering modes, 'count' or 'percentage'.
    mode: visflow.Sampler.Mode.COUNT,
    // Filtering count or percentage
    number: 5,
    // Group by dimension.
    groupBy: '',
    // Whether the values shall be uniqued before data items are filtered.
    unique: false
  });
};
