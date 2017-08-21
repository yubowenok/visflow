/**
 * @fileoverview Histogram panel functions.
 */

/** @inheritDoc */
visflow.Histogram.prototype.initPanel = function(container) {
  var dimensionList = this.getDimensionList();
  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#dim'),
        list: dimensionList,
        selected: this.options.dim,
        listTitle: 'Distribution Dimension'
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#bins'),
        value: this.options.numBins,
        accept: visflow.ValueType.INT,
        range: [1, 1000],
        scrollDelta: 1,
        title: 'Number of Bins'
      },
      change: function(event, value) {
        this.options.numBins = value;
        this.prepareScales();
        this.show();

        // Bins have changed, and previous selection do not apply.
        this.selectedBars = {};
        this.selected = {};
      }
    }
  ];
  this.initInterface(units);
};
