/**
 * @fileoverview Contain filter defs.
 */

/** @inheritDoc */
visflow.ContainFilter.prototype.TEMPLATE =
  './dist/html/filter/contain-filter/contain-filter.html';
/** @inheritDoc */
visflow.ContainFilter.prototype.PANEL_TEMPLATE =
  './dist/html/filter/contain-filter/contain-filter-panel.html';
/** @inheritDoc */
visflow.ContainFilter.prototype.NODE_NAME = 'Contain Filter';
/** @inheritDoc */
visflow.ContainFilter.prototype.NODE_CLASS = 'contain-filter';

/** @inheritDoc */
visflow.ContainFilter.prototype.defaultOptions = function() {
  return new visflow.options.ContainFilter({
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
