/**
 * @fileoverview LineChart defs.
 */

/** @inheritDoc */
visflow.LineChart.prototype.NODE_CLASS = 'line-chart';

/** @inheritDoc */
visflow.LineChart.prototype.NODE_NAME = 'Line Chart';

/** @inheritDoc */
visflow.LineChart.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/line-chart/line-chart-panel.html';

/** @inheritDoc */
visflow.LineChart.prototype.defaultOptions = function() {
  return new visflow.options.LineChart({
    // Series dimension.
    xDim: visflow.data.INDEX_DIM,
    // Value dimension.
    yDim: 0,
    // Group by dimension, must be key.
    groupBy: '',
    // Show points.
    points: false,
    // Show legends.
    legends: true,
    // Use curve to draw lines.
    curve: false,
    // Show x-axis ticks.
    xTicks: true,
    // Show y-axis ticks.
    yTicks: true,
    // X domain margin.
    xMargin: 0.1,
    // Y domain margin.
    yMargin: 0.1
  });
};

/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_X_ = 10;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_Y_ = 15;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_MARGIN_RIGHT_ = 5;
/**
 * This includes the colorbox size.
 * @private @const {number}
 */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_X_ = 15;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_Y_ = 10;

/** @inheritDoc */
visflow.LineChart.prototype.defaultProperties = function() {
  return {
    color: '#333',
    border: 'black',
    width: 1.5,
    size: 3,
    opacity: 1
  };
};

/** @inheritDoc */
visflow.LineChart.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: '#6699ee'
  };
};

/**
 * Rendering properties for selected lines.
 * @return {{
 *   color: string,
 *   width: number
 * }}
 */
visflow.LineChart.prototype.selectedLineProperties = function() {
  return {
    color: '#6699ee',
    width: 2
  };
};
