/**
 * @fileoverview Scatterplot panel functions.
 */

/** @inheritDoc */
visflow.Scatterplot.prototype.initPanel = function(container) {
  visflow.Scatterplot.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#x-dim'),
        list: dimensionList,
        selected: this.options.xDim,
        listTitle: 'X Dimension'
      },
      change: function(event, dim) {
        this.options.xDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#y-dim'),
        list: dimensionList,
        selected: this.options.yDim,
        listTitle: 'Y Dimension'
      },
      change: function(event, dim) {
        this.options.yDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#x-ticks'),
        value: this.options.xTicks,
        title: 'X Ticks'
      },
      change: function(event, value) {
        this.options.xTicks = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#y-ticks'),
        value: this.options.yTicks,
        title: 'Y Ticks'
      },
      change: function(event, value) {
        this.options.yTicks = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#x-margin'),
        value: this.options.xMargin,
        title: 'X Domain Margin',
        accept: visflow.ValueType.FLOAT,
        scrollDelta: 0.05,
        range: [0, 100]
      },
      change: function(event, value) {
        this.options.xMargin = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#y-margin'),
        value: this.options.yMargin,
        title: 'Y Domain Margin',
        accept: visflow.ValueType.FLOAT,
        scrollDelta: 0.05,
        range: [0, 100]
      },
      change: function(event, value) {
        this.options.yMargin = value;
        this.layoutChanged();
      }
    }
  ];
  this.initInterface(units);
};
