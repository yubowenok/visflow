/**
 * @fileoverview Parallel coordinates defs.
 */

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/parallel-coordinates/parallel-coordinates-panel.html';

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.NODE_CLASS = 'parallel-coordinates';

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.NODE_NAME = 'ParallelCoordinates';

/**
 * Default number of dimension shown.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.DEFAULT_NUM_DIMENSIONS_ = 7;

/**
 * Offset from the leftmost axis to the tick text.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.AXIS_TICK_OFFSET_ = 8;

/**
 * Y offset of the axes labels, to the plot bottom.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.AXIS_LABEL_OFFSET_ = 5;

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.defaultOptions = function() {
  return new visflow.options.ParallelCoordinates({
    dims: [],
    ticks: true,
    axisLabel: true
  });
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.defaultProperties = function() {
  return {
    color: 'black',
    width: 2,
    fill: 'none',
    opacity: 0.15
  };
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectedProperties = function() {
  return {
    color: '#6699ee',
    opacity: 0.75
  };
};
