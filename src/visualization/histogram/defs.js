/**
 * @fileoverview Histogram defs.
 */

/** @inheritDoc */
visflow.Histogram.prototype.NODE_CLASS = 'histogram';

/** @inheritDoc */
visflow.Histogram.prototype.NODE_NAME = 'Histogram';

/** @inheritDoc */
visflow.Histogram.prototype.PANEL_TEMPLATE =
  './src/visualization/histogram/histogram-panel.html';

/** @private @const {number} */
visflow.Histogram.prototype.Y_MARGIN_ = 0.1;

/** @private @const {number} */
visflow.Histogram.prototype.BAR_INTERVAL_ = 1;

/** @inheritDoc */
visflow.Histogram.prototype.defaultOptions = function() {
  return new visflow.options.Histogram({
    // Number of histogram bins.
    numBins: 10
  });
};

/** @inheritDoc */
visflow.Histogram.prototype.plotMargins = function() {
  return {
    left: 25,
    right: 10,
    top: 10,
    bottom: 20
  };
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
    border: '#6699ee',
    width: 1.5
  };
};

/** @inheritDoc */
visflow.Histogram.prototype.selectedMultiplier = function() {
  return {
    width: 1.2
  };
};
