/**
 * @fileoverview Value filter defs.
 */

/** @inheritDoc */
visflow.ValueFilter.prototype.TEMPLATE =
  './dist/html/filter/value-filter/value-filter.html';
/** @inheritDoc */
visflow.ValueFilter.prototype.PANEL_TEMPLATE =
  './dist/html/filter/value-filter/value-filter-panel.html';
/** @inheritDoc */
visflow.ValueFilter.prototype.NODE_NAME = 'Value Filter';
/** @inheritDoc */
visflow.ValueFilter.prototype.NODE_CLASS = 'value-filter';

/** @inheritDoc */
visflow.ValueFilter.prototype.defaultOptions = function() {
  return new visflow.options.ValueFilter({
    // Dimensions to be filtered on.
    dims: [],
    // Whether input is treated as normal text or regex.
    // 'text' or 'regex'.
    mode: 'text',
    // Matching target. 'full' or 'substring'.
    target: 'full',
    // Whether to ignore cases in matching.
    ignoreCases: true,
    // Filtering value specified by directly typing in the input boxes.
    // Type-in value is stored as string.
    typeInValue: null
  });
};
