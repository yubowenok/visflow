/**
 * @fileoverview Value filter panel functions.
 */

/** @inheritDoc */
visflow.ValueFilter.prototype.initPanel = function(container) {
  var units = [
    // Dimension
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
    // Value
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#value'),
        value: this.value,
        title: 'Value(s)',
        disabled: this.ports['inVal'].connected()
      },
      change: function(event, value) {
        this.options.typeInValue = '' + value;
        this.parameterChanged();
      }
    },
    // Mode
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#mode'),
        list: [
          {id: 'text', text: 'Text'},
          {id: 'regex', text: 'Regex'}
        ],
        selected: this.options.mode,
        listTitle: 'Matching Mode'
      },
      change: function(event, mode) {
        this.options.mode = mode;
        this.parameterChanged();
      }
    },
    // Target
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#target'),
        list: [
          {id: 'full', text: 'Full String'},
          {id: 'substring', text: 'Substring'}
        ],
        selected: this.options.target,
        listTitle: 'Matching Target'
      },
      change: function(event, target) {
        this.options.target = target;
        this.parameterChanged();
      }
    },
    // Ignore cases
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#ignore-cases'),
        value: this.options.ignoreCases,
        title: 'Ignore Cases'
      },
      change: function(event, value) {
        this.options.ignoreCases = value;
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};
