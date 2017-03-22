/**
 * @fileoverview Range filter defs.
 */

/** @inheritDoc */
visflow.RangeFilter.prototype.TEMPLATE =
  './dist/html/filter/range-filter/range-filter.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.PANEL_TEMPLATE =
  './dist/html/filter/range-filter/range-filter-panel.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.DEFAULT_LABEL = 'Filter';
/** @inheritDoc */
visflow.RangeFilter.prototype.NODE_CLASS = 'range-filter';

/**
 * @typedef {{
 *   dim: number,
 *   range: !Array<number|string>
 * }}
 */
visflow.RangeFilter.Spec;

/** @inheritDoc */
visflow.RangeFilter.prototype.defaultOptions = function() {
  return new visflow.options.RangeFilter({
    // Filtering dimension.
    dim: undefined,
    // Filtering range values specified by directly typing in the input boxes.
    // Type-in values are stored as strings.
    typeInValue: []
  });
};
