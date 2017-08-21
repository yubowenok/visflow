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
   * Filtering value(s) applied.
   * @protected {!Array<number|string>}
   */
  this.values = [];
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
      constructor: visflow.Select,
      params: {
        container: this.content.find('#dim'),
        list: this.getDimensionList(),
        selected: this.options.dim,
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null,
        allowClear: true
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    },
    // Value
    {
      constructor: visflow.Input,
      params: {
        container: this.content.find('#value'),
        value: this.values,
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
  this.values = pack.getAll();

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

/**
 * Value filters the subset with a given specification.
 * @param {visflow.ValueFilter.Spec} spec
 * @param {!visflow.Package} pack
 * @return {!Array<number>} Resulting subset as array.
 */
visflow.ValueFilter.filter = function(spec, pack) {
  if (spec.dim === undefined) {
    return [];
  }
  var result = [];
  var dim = spec.dim;
  var items = pack.items;
  var ignoreCases = spec.ignoreCases !== undefined ? !!spec.ignoreCases : true;
  for (var itemIndex in items) {
    var index = +itemIndex;
    var matched = false;
    var value = '' + pack.getValue(index, dim);
    if (ignoreCases) {
      value = value.toLowerCase();
    }
    for (var i = 0; i < spec.values.length && !matched; i++) {
      var pattern = spec.values[i] + '';
      if (ignoreCases) {
        pattern = pattern.toLowerCase();
      }
      if (spec.mode == visflow.ValueFilter.Mode.REGEX) {
        pattern = RegExp(pattern);
        var m = value.match(pattern);
        matched = m != null &&
          (spec.target == visflow.ValueFilter.Target.SUBSTRING ||
          m[0] == value);
      } else {
        // text matching
        if (spec.target == visflow.ValueFilter.Target.FULL) {
          matched = value === pattern;
        } else {
          matched = value.indexOf(pattern) != -1;
        }
      }
    }
    if (matched) {
      result.push(index);
    }
  }
  return result;
};

/** @inheritDoc */
visflow.ValueFilter.prototype.filter = function() {
  // Slow implementation: Linear scan
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;

  var result = visflow.ValueFilter.filter({
    dim: this.options.dim,
    values: this.values,
    mode: this.options.mode,
    target: this.options.target,
    ignoreCases: this.options.ignoreCases
  }, inpack);

  outpack.copy(inpack);
  outpack.filter(result);
};

/**
 * Sets the filter-by value.
 * @param {number} dim
 * @param {string} value
 * @param {visflow.ValueFilter.Target=} opt_target
 */
visflow.ValueFilter.prototype.setValue = function(dim, value, opt_target) {
  var target = opt_target !== undefined ? opt_target :
    visflow.ValueFilter.Target.SUBSTRING;
  this.options.dim = dim;
  this.options.typeInValue = value;
  this.options.mode = visflow.ValueFilter.Mode.TEXT;
  this.options.target = target;
  this.parameterChanged();
};

/**
 * Gets the constant input port.
 * @return {!visflow.Port}
 */
visflow.ValueFilter.prototype.getConstantInPort = function() {
  return this.ports['inVal'];
};
