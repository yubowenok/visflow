/**
 * @fileoverview Histogram defs.
 */


/** @inheritDoc */
visflow.Histogram.prototype.NODE_CLASS = 'histogram';

/** @inheritDoc */
visflow.Histogram.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/histogram/histogram-panel.html';

/** @const {number} */
visflow.Histogram.Y_MARGIN = 0.1;

/** @const {number} */
visflow.Histogram.BAR_INTERVAL = 1;

/** @inheritDoc */
visflow.Histogram.prototype.defaultOptions = function() {
  return new visflow.options.Histogram({
    // Number of histogram bins.
    numBins: 10
  });
};

/** @inheritDoc */
visflow.Histogram.prototype.defaultProperties = function() {
  return {
    color: '#555',
    opacity: 1
  };
};

/** @inheritDoc */
visflow.Histogram.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: visflow.const.SELECTED_COLOR,
    width: 1.5
  };
};

/** @inheritDoc */
visflow.Histogram.prototype.selectedMultiplier = function() {
  return {
    width: 1.2
  };
};
