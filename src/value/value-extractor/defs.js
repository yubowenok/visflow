/**
 * @fileoverview ValueExtractor defs.
 */

/** @inheritDoc */
visflow.ValueExtractor.prototype.NODE_CLASS = 'value-extractor';

/** @inheritDoc */
visflow.ValueExtractor.prototype.TEMPLATE =
  './dist/html/value/value-extractor/value-extractor.html';

/** @inheritDoc */
visflow.ValueExtractor.prototype.PANEL_TEMPLATE =
  './dist/html/value/value-extractor/value-extractor-panel.html';

/** @inheritDoc */
visflow.ValueExtractor.prototype.MIN_WIDTH = 120;
/** @inheritDoc */
visflow.ValueExtractor.prototype.MIN_HEIGHT = 45;
/** @inheritDoc */
visflow.ValueExtractor.prototype.MAX_HEIGHT = 45;

/** @protected @const {string} */
visflow.ValueExtractor.prototype.NO_DATA_STRING = 'No Data';

/** @inheritDoc */
visflow.ValueExtractor.prototype.defaultOptions = function() {
  return new visflow.options.ValueExtractor({
    // Dimensions from which to extract values.
    dims: []
  });
};
