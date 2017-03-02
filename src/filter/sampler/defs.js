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
visflow.Sampler.prototype.NODE_NAME = 'Sampler';
/** @inheritDoc */
visflow.Sampler.prototype.NODE_CLASS = 'sampler';

/** @inheritDoc */
visflow.Sampler.prototype.MAX_HEIGHT = 45;
/** @inheritDoc */
visflow.Sampler.prototype.MIN_HEIGHT = 45;

/**
 * Condition for sampling.
 * @return {!Array<{id: string, text: string}>}
 * @private
 */
visflow.Sampler.prototype.conditions_ = function() {
  return [
    {id: 'first', text: 'First / Minimum'},
    {id: 'last', text: 'Last / Maximum'},
    {id: 'sampling', text: 'Random Sampling'}
  ];
};

/**
 * Modes for band limiting.
 * @return {!Array<{id: string, text: string}>}
 * @private
 */
visflow.Sampler.prototype.modes_ = function() {
  return [
    {id: 'count', text: 'Count'},
    {id: 'percentage', text: 'Percentage'}
  ];
};

/** @inheritDoc */
visflow.Sampler.prototype.defaultOptions = function() {
  return new visflow.options.Sampler({
    // Dimension to be filtered on.
    dim: 0,
    // Filtering conditions, 'first', 'last' or 'sampling'.
    condition: 'first',
    // Filtering modes, 'count' or 'percentage'.
    mode: 'count',
    // Filtering count or percentage
    number: 5,
    // Group by dimension.
    groupBy: '',
    // Whether the values shall be uniqued before data items are filtered.
    unique: false
  });
};
