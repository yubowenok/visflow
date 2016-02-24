/**
 * @fileoverview Range filter defs.
 */

/** @inheritDoc */
visflow.RangeFilter.prototype.TEMPLATE =
  './src/filter/range-filter/range-filter.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.PANEL_TEMPLATE =
  './src/filter/range-filter/range-filter-panel.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.NODE_NAME = 'Range Filter';
/** @inheritDoc */
visflow.RangeFilter.prototype.NODE_CLASS = 'range-filter';

/** @inheritDoc */
visflow.RangeFilter.prototype.defaultOptions = function() {
  return new visflow.options.RangeFilter({
    // Filtering dimensions.
    dims: [],
    // Filtering range values specified by directly typing in the input boxes.
    // Type-in values are stored as strings.
    typeInValue: []
  });
};
