/**
 * @fileoverview Range filter panel functions.
 */

/** @inheritDoc */
visflow.RangeFilter.prototype.initPanel = function(container) {
  var units = [
    // Dimensions
    {
      constructor: visflow.MultipleSelect,
      params: {
        container: container.find('#dims'),
        list: this.getDimensionList(),
        selected: this.options.dims,
        listTitle: 'Filtering Dimension(s)',
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dims) {
        if (dims == null) {
          dims = [];
        }
        this.options.dims = dims;
        this.parameterChanged();
      }
    },
    // Min Value
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#min'),
        value: this.value[0],
        title: 'Min Value',
        disabled: this.ports['inMin'].connected()
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
        value: this.value[1],
        title: 'Max Value',
        disabled: this.ports['inMax'].connected()
      },
      change: function(event, value) {
        this.options.typeInValue[1] = '' + value;
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};
