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
 * @const {number}
 */
visflow.ParallelCoordinates.DEFAULT_NUM_DIMENSIONS = 7;

/**
 * Offset from the leftmost axis to the tick text.
 * @const {number}
 */
visflow.ParallelCoordinates.AXIS_TICK_OFFSET = 8;

/**
 * Y offset of the axes labels, to the plot bottom.
 * @const {number}
 */
visflow.ParallelCoordinates.AXIS_LABEL_OFFSET = 5;

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
    color: visflow.const.SELECTED_COLOR,
    opacity: 0.75
  };
};
