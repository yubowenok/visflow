/**
 * @fileoverview VisFlow contain filter module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.ContainFilter = function(params) {
  visflow.ContainFilter.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    inVal: new visflow.Port({
      node: this,
      id: 'inVal',
      text: 'containing value',
      isInput: true,
      isConstants: true
    }),
    in: new visflow.MultiplePort({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };

  /**
   * Filtering value applied.
   * @protected {!Array<number|string>}
   */
  this.value = [];
};

visflow.utils.inherit(visflow.ContainFilter, visflow.Filter);

/** @inheritDoc */
visflow.ContainFilter.prototype.TEMPLATE =
  './src/filter/contain-filter/contain-filter.html';
/** @inheritDoc */
visflow.ContainFilter.prototype.PANEL_TEMPLATE =
  './src/filter/contain-filter/contain-filter-panel.html';
/** @inheritDoc */
visflow.ContainFilter.prototype.NODE_NAME = 'Contain Filter';
/** @inheritDoc */
visflow.ContainFilter.prototype.NODE_CLASS = 'contain-filter';

/** @inheritDoc */
visflow.ContainFilter.prototype.DEFAULT_OPTIONS = {
  // Dimensions to be filtered on.
  dims: [],
  // Whether input is treated as normal text or regex.
  // 'text' or 'regex'.
  mode: 'text',
  // Matching target. 'full' or 'substring'.
  target: 'full',
  // Whether to ignore cases in matching.
  ignoreCases: true,
  // Filtering value specified by directly typing in the input boxes.
  // Type-in value is stored as string.
  typeInValue: null
};

/** @inheritDoc */
visflow.ContainFilter.prototype.deserialize = function(save) {
  visflow.ContainFilter.base.deserialize.call(this, save);
  if (save.typeInValue) {
    this.options.typeInValue = save.typeInValue;
  }
};

/** @inheritDoc */
visflow.ContainFilter.prototype.initPanel = function(container) {
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

/** @inheritDoc */
visflow.ContainFilter.prototype.showDetails = function() {
  visflow.ContainFilter.base.showDetails.call(this);

  var units = [
    // Dimension
    {
      constructor: visflow.MultipleSelect,
      params: {
        container: this.content.find('#dims'),
        list: this.getDimensionList(),
        selected: this.options.dims,
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
        container: this.content.find('#value'),
        value: this.value,
        disabled: this.ports['inVal'].connected()
      },
      change: function(event, value) {
        this.options.typeInValue = '' + value;
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};

/** @inheritDoc */
visflow.ContainFilter.prototype.process = function() {
  var port = this.ports['inVal'];
  var pack;
  if (port.connected()) {
    pack = port.pack;
  } else if (this.options.typeInValue != null) {
    pack = new visflow.Constants(this.options.typeInValue);
  } else {
    // Empty constants
    pack = port.pack;
  }
  this.value = pack.getAll();

  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  if (inpack.isEmpty()) {
    outpack.copy(inpack);
    return;
  }

  if (this.lastDataId != inpack.data.dataId) {
    this.lastDataId = inpack.data.dataId;
    this.dataChanged();
  }

  // Do the actual filtering.
  this.filter();
};

/** @inheritDoc */
visflow.ContainFilter.prototype.filter = function() {
  // Slow implementation: Linear scan
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  var items = inpack.items;
  var data = inpack.data;

  var result = [];
  for (var index in items) {
    var matched = false;
    for (var dimIndex = 0; dimIndex < this.options.dims.length && !matched;
         dimIndex++) {
      var dim = this.options.dims[dimIndex];
      var value = '' + data.values[index][dim];
      if (this.options.ignoreCases) {
        value = value.toLowerCase();
      }
      for (var i = 0; i < this.value.length && !matched; i++) {
        var pattern = this.value[i] + '';
        if (this.options.ignoreCases) {
          pattern = pattern.toLowerCase();
        }
        if (this.options.mode == 'regex') {
          pattern = RegExp(pattern);
          var m = value.match(pattern);
          matched = m != null &&
            (this.options.target == 'substring' || m[0] == value);
        } else {
          // text matching
          if (this.options.target == 'full') {
            matched = value === pattern;
          } else {
            matched = value.indexOf(pattern) != -1;
          }
        }
      }
    }
    if (matched) {
      result.push(index);
    }
  }
  outpack.copy(inpack);
  outpack.filter(result);
};
