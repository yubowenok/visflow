/**
 * @fileoverview VisFlow range filter module.
 */

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.RangeFilter = function(params) {
  visflow.RangeFilter.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'inMin': new visflow.ConstantPort({
      node: this,
      id: 'inMin',
      text: 'range min',
      isInput: true
    }),
    'inMax': new visflow.ConstantPort({
      node: this,
      id: 'inMax',
      text: 'range max',
      isInput: true
    }),
    'in': new visflow.SubsetPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };

  /**
   * Filtering range applied.
   * @protected {!Array<null|number|string>}
   */
  this.range = [];
};

_.inherit(visflow.RangeFilter, visflow.Filter);

/** @inheritDoc */
visflow.RangeFilter.prototype.deserialize = function(save) {
  visflow.RangeFilter.base.deserialize.call(this, save);
  if (save.typeInValue) {
    this.options.typeInValue = save.typeInValue;
  }
};

/** @inheritDoc */
visflow.RangeFilter.prototype.showDetails = function() {
  visflow.RangeFilter.base.showDetails.call(this);

  var uiElements = [
    // Dimensions
    {
      constructor: visflow.Select,
      params: {
        container: this.content.find('#dim'),
        list: this.getDimensionList(),
        selected: this.options.dim,
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
          this.NO_DATA_STRING : null,
        allowClear: true
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    },
    // Min value
    {
      constructor: visflow.Input,
      params: {
        container: this.content.find('#min'),
        value: this.formatRange(this.range[0]),
        disabled: this.getPort('inMin').connected()
      },
      change: function(event, value) {
        this.options.typeInValue[0] = '' + value;
        this.parameterChanged();
      }
    },
    // Max value
    {
      constructor: visflow.Input,
      params: {
        container: this.container.find('#max'),
        value: this.formatRange(this.range[1]),
        disabled: this.getPort('inMax').connected()
      },
      change: function(event, value) {
        this.options.typeInValue[1] = '' + value;
        this.parameterChanged();
      }
    }
  ];

  this.showUiElements(uiElements);
};

/** @inheritDoc */
visflow.RangeFilter.prototype.processSync = function() {
  var packs = [];
  [
    {portId: 'inMin', index: 0},
    {portId: 'inMax', index: 1}
  ].forEach(function(info) {
    var port = this.getPort(info.portId);
    var index = info.index;
    var pack;
    if (port.connected()) {
      pack = port.pack;
    } else if (this.options.typeInValue[index] != null) {
      pack = new visflow.Constants(this.options.typeInValue[index]);
    } else {
      // Empty pack.
      pack = port.pack;
    }
    packs[index] = pack;

    this.range[index] = pack.getOne();
  }, this);

  if (!packs[0].compatible(packs[1])) {
    visflow.warning('incompatible constant types in ', this.label);
    // TODO(bowen): Promote constant type?
    return;
  }

  if (this.range[0] != null && this.range[1] != null &&
      this.range[0] > this.range[1]) {
    visflow.warning('minValue > maxValue in', this.label);
  }

  var inpack = /** @type {!visflow.Subset} */(this.getDataInPort().pack);
  var outpack = this.getDataOutPort().pack;
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
 * Formats a range value to readable form.
 * @param {null|number|string} value
 * @return {string}
 */
visflow.RangeFilter.prototype.formatRange = function(value) {
  var data = this.getDataInPort().pack.data;
  // Use loose date check.
  // On empty data, we always show raw value.
  // Otherwise when dim is selected and we have input data,
  // we check if the chosen dimension is a time dimension.
  // If so we format the time.
  if (!data.isEmpty() && this.options.dim != null &&
    data.dimensionTypes[this.options.dim] == visflow.ValueType.TIME &&
    visflow.utils.isProbablyDate(value, false)) {
    return visflow.utils.formatTime('' + value);
  }
  if (value == null) {
    return '';
  }
  return '' + value;
};

/**
 * Range filters the subset with a given specification.
 * @param {visflow.RangeFilter.Spec} spec
 * @param {!visflow.Subset} pack
 * @return {!Array<number>} Resulting subset as array.
 */
visflow.RangeFilter.filter = function(spec, pack) {
  if (spec.dim === undefined) {
    return [];
  }
  var result = [];
  var items = pack.items;
  var range = spec.range;
  for (var itemIndex in items) {
    var index = +itemIndex;
    var value = pack.getValue(index, spec.dim);
    if ((range[0] == null || value >= range[0]) &&
      (range[1] == null || value <= range[1])) {
      result.push(index);
    }
  }
  return result;
};

/** @inheritDoc */
visflow.RangeFilter.prototype.filter = function() {
  // Slow implementation: Linear scan
  var inpack = /** @type {!visflow.Subset} */(this.getDataInPort().pack);

  var result = visflow.RangeFilter.filter({
    dim: this.options.dim,
    range: this.range
  }, inpack);

  var outpack = this.getDataOutPort().pack;
  outpack.copy(inpack);
  outpack.filter(result);
};

/**
 * Sets the filter range.
 * This sets typeInValue as if the user inputs in the node directly.
 * This is only called by NLP and the node shall not have its constant ports
 * connected.
 * @param {number} dim
 * @param {number|string|null} low
 * @param {number|string|null} high
 */
visflow.RangeFilter.prototype.setRange = function(dim, low, high) {
  this.options.dim = dim;
  // Note that typeInValues must be string
  this.options.typeInValue[0] = low == null ? null : '' + low;
  this.options.typeInValue[1] = high == null ? null : '' + high;
  if (low != null && this.getPort('inMin').connected()) {
    console.error('inMin port already connected while set');
  }
  if (high != null && this.getPort('inMax').connected()) {
    console.error('inMax port already connected while set');
  }
  this.parameterChanged();
};

