/**
 * @fileoverview Map panel functions.
 */

/** @inheritDoc */
visflow.Map.prototype.initPanel = function(container) {
  var dimensionList = this.getDimensionList();
  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#lat-dim'),
        list: dimensionList,
        selected: this.options.latDim,
        listTitle: 'Latitude'
      },
      change: function(event, dim) {
        this.options.latDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#lon-dim'),
        list: dimensionList,
        selected: this.options.lonDim,
        listTitle: 'Longitude'
      },
      change: function(event, dim) {
        this.options.lonDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#heatmap'),
        value: this.options.heatmap,
        title: 'Use Heatmap'
      },
      change: function(event, value) {
        this.options.heatmap = value;
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#navigation'),
        value: this.options.navigation,
        title: 'Navigation'
      },
      change: function(event, value) {
        this.options.navigation = value;
      }
    }
  ];
  this.initInterface(units);
};
