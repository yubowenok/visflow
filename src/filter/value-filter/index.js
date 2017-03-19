/**
 * @fileoverview VisFlow Value Filter module.
 */

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.ValueFilter = function(params) {
  visflow.ValueFilter.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'inVal': new visflow.Port({
      node: this,
      id: 'inVal',
      text: 'containing value',
      isInput: true,
      isConstants: true
    }),
    'in': new visflow.Port({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    'out': new visflow.MultiplePort({
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

_.inherit(visflow.ValueFilter, visflow.Filter);

/** @inheritDoc */
visflow.ValueFilter.prototype.deserialize = function(save) {
  visflow.ValueFilter.base.deserialize.call(this, save);
  if (save.typeInValue) {
    this.options.typeInValue = save.typeInValue;
  }
};

/** @inheritDoc */
visflow.ValueFilter.prototype.showDetails = function() {
  visflow.ValueFilter.base.showDetails.call(this);

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
visflow.ValueFilter.prototype.process = function() {
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

  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
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
visflow.ValueFilter.prototype.filter = function() {
  // Slow implementation: Linear scan
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;
  var items = inpack.items;
  var data = inpack.data;

  var result = [];
  for (var itemIndex in items) {
    var index = +itemIndex;
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
        if (this.options.mode == visflow.ValueFilter.Mode.REGEX) {
          pattern = RegExp(pattern);
          var m = value.match(pattern);
          matched = m != null &&
            (this.options.target == visflow.ValueFilter.Target.SUBSTRING ||
              m[0] == value);
        } else {
          // text matching
          if (this.options.target == visflow.ValueFilter.Target.FULL) {
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

/**
 * Sets the filter-by value.
 * @param {number} dim
 * @param {string} value
 */
visflow.ValueFilter.prototype.setValue = function(dim, value) {
  this.options.dims = [dim];
  this.options.typeInValue = value;
  this.options.mode = visflow.ValueFilter.Mode.TEXT;
  this.options.target = visflow.ValueFilter.Target.SUBSTRING;
  this.parameterChanged();
};
