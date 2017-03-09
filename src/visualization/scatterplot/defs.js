/**
 * @fileoverview Scatterplot defs.
 */

/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_CLASS = 'scatterplot';

/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_NAME = 'Scatterplot';

/** @inheritDoc */
visflow.Scatterplot.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/scatterplot/scatterplot-panel.html';

/** @inheritDoc */
visflow.Scatterplot.prototype.defaultOptions = function() {
  return new visflow.options.Scatterplot({
    // X dimension.
    xDim: 0,
    // Y dimension.
    yDim: 0,
    // Show x-axis ticks.
    xTicks: true,
    // Show y-axis ticks.
    yTicks: true,
    // Margin percentage of x.
    xMargin: 0.1,
    // Margin percentage of y.
    yMargin: 0.1
  });
};

/** @inheritDoc */
visflow.Scatterplot.prototype.defaultProperties = function() {
  return {
    color: '#333',
    border: 'black',
    width: 1,
    size: 3,
    opacity: 1
  };
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: visflow.const.SELECTED_COLOR
  };
};
