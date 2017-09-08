/**
 * @fileoverview Sampler panel functions.
 */

/** @inheritDoc */
visflow.Sampler.prototype.initPanel = function(container) {
  this.panelElements = [
    // Group By
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#group-by'),
        list: this.getDimensionList(null),
        allowClear: true,
        selected: this.options.groupBy,
        listTitle: 'Group By',
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.groupBy = dim;
        this.parameterChanged();
      }
    },
    // Dimension
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#dim'),
        list: this.getDimensionList(null, true),
        selected: this.options.dim,
        listTitle: 'Filtering Dimension',
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    },
    // Condition
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#condition'),
        list: this.conditions(),
        selected: this.options.condition,
        listTitle: 'Condition'
      },
      change: function(event, condition) {
        this.options.condition = condition;
        this.parameterChanged();
      }
    },
    // Mode
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#mode'),
        list: this.modes(),
        selected: this.options.mode,
        listTitle: 'Mode'
      },
      change: function(event, mode) {
        this.options.mode = mode;
        this.parameterChanged();
      }
    },
    // Number
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#num'),
        value: this.options.number,
        scrollDelta: 1,
        accept: visflow.ValueType.INT,
        title: 'Number to Pass'
      },
      change: function(event, number) {
        this.options.number = number;
        this.parameterChanged();
      }
    },
    // Unique
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#unique'),
        value: this.options.unique,
        title: 'Unique Values'
      },
      change: function(event, value) {
        this.options.unique = value;
        this.parameterChanged();
      }
    }
  ];
};
