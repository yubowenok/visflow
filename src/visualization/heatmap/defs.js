/**
 * @fileoverview Heatmap options.
 */

/** @inheritDoc */
visflow.Heatmap.prototype.NODE_NAME = 'Heatmap';

/** @inheritDoc */
visflow.Heatmap.prototype.NODE_CLASS = 'heatmap';

/** @inheritDoc */
visflow.Heatmap.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/heatmap/heatmap-panel.html';

/** @const {number} */
visflow.Heatmap.ROW_LABEL_OFFSET = 10;

/** @const {number} */
visflow.Heatmap.COL_LABEL_OFFSET = 10;

/** @const {number} */
visflow.Heatmap.ROW_LABEL_CLUTTER_OFFSET = 5;

/** @const {string} */
visflow.Heatmap.ROW_LABEL_CLUTTER_MSG = '(too many labels to show)';

/**
 * Default number of dimensions the heatmap would show.
 * @const {number}
 */
visflow.Heatmap.DEFAULT_NUM_DIMENSION = 5;

/** @const {number} */
visflow.Heatmap.LABEL_FONT_SIZE_X = 6;

/** @const {number} */
visflow.Heatmap.LABEL_FONT_SIZE_Y = 9;

/** @inheritDoc */
visflow.Heatmap.prototype.defaultOptions = function() {
  return new visflow.options.Heatmap({
    // Id corresponding to the id of visflow.scales.
    colorScaleId: 'redGreen',
    // By which column value shall the rows be sorted.
    sortBy: 0,
    // By which column value shall the rows be labeled. If this is empty string,
    // then show no row label.
    labelBy: 0,
    // Whether to show column label.
    colLabel: true
  });
};

/** @inheritDoc */
visflow.Heatmap.prototype.defaultProperties = function() {
  return {
    color: '#555'
  };
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedProperties = function() {
  return {
    border: visflow.const.SELECTED_COLOR,
    color: '#333',
    width: 1.5
  };
};

