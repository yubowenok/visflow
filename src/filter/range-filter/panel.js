/**
 * @fileoverview Range filter panel functions.
 */

/** @inheritDoc */
visflow.RangeFilter.prototype.initPanel = function(container) {
  this.panelElements = [
    // Dimensions
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#dim'),
        list: this.getDimensionList(),
        selected: this.options.dim,
        listTitle: 'Filtering Dimension',
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
          this.NO_DATA_STRING : null,
        allowClear: true
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    },
    // Min Value
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#min'),
        value: this.formatRange(this.range[0]),
        title: 'Min Value',
        disabled: this.getPort('inMin').connected()
      },
      change: function(event, value) {
        this.options.typeInValue[0] = '' + value;
        this.parameterChanged();
      }
    },
    // Max Value
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#max'),
        value: this.formatRange(this.range[1]),
        title: 'Max Value',
        disabled: this.getPort('inMax').connected()
      },
      change: function(event, value) {
        this.options.typeInValue[1] = '' + value;
        this.parameterChanged();
      }
    }
  ];
};
