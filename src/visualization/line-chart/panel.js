/**
 * @fileoverview LineChart panel functions.
 */

/** @inheritDoc */
visflow.LineChart.prototype.initPanel = function(container) {
  visflow.LineChart.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList(null, true);

  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#x-dim'),
        list: dimensionList,
        selected: this.options.xDim,
        listTitle: 'Series'
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
        listTitle: 'Value'
      },
      change: function(event, dim) {
        this.options.yDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#group-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.groupBy,
        listTitle: 'Group By'
      },
      change: function(event, dim) {
        this.options.groupBy = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#points'),
        value: this.options.points,
        title: 'Points'
      },
      change: function(event, value) {
        this.options.points = value;
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#legends'),
        value: this.options.legends,
        title: 'Legends'
      },
      change: function(event, value) {
        this.options.legends = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#curve'),
        value: this.options.curve,
        title: 'Curve'
      },
      change: function(event, value) {
        this.options.curve = value;
        this.show();
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
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#y-ticks'),
        value: this.options.xTicks,
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
  this.updateCollisionMessage();
};

/**
 * Updates the collision message in the panel.
 * @protected
 */
visflow.LineChart.prototype.updateCollisionMessage = function() {
  if (!visflow.optionPanel.isOpen) {
    return;
  }
  var container = visflow.optionPanel.contentContainer();
  var collided = container.find('#collided');
  if (this.xCollided) {
    collided.show();
    collided.children('#msg').text(this.xCollidedMsg);
  } else {
    collided.hide();
  }
};
