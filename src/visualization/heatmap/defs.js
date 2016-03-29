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

/** @private @const {number} */
visflow.Heatmap.prototype.ROW_LABEL_OFFSET_ = 10;

/** @private @const {number} */
visflow.Heatmap.prototype.COL_LABEL_OFFSET_ = 10;

/** @private @const {number} */
visflow.Heatmap.prototype.ROW_LABEL_CLUTTER_OFFSET_ = 5;

/** @private @const {string} */
visflow.Heatmap.prototype.ROW_LABEL_CLUTTER_MSG_ = '(too many labels to show)';

/**
 * Default number of dimensions the heatmap would show.
 * @private
 */
visflow.Heatmap.prototype.DEFAULT_NUM_DIMENSION_ = 5;

/** @private @const {number} */
visflow.Heatmap.prototype.LABEL_FONT_SIZE_X_ = 6;

/** @private @const {number} */
visflow.Heatmap.prototype.LABEL_FONT_SIZE_Y_ = 9;

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
    border: '#6699ee',
    color: '#333',
    width: 1.5
  };
};

