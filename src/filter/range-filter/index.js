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
    'inMin': new visflow.Port({
      node: this,
      id: 'inMin',
      text: 'range min',
      isInput: true,
      isConstants: true
    }),
    'inMax': new visflow.Port({
      node: this,
      id: 'inMax',
      text: 'range max',
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
   * Filtering range applied.
   * @protected {!Array<number|string>}
   */
  this.value = [];
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

  var units = [
    // Dimensions
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
    // Min value
    {
      constructor: visflow.Input,
      params: {
        container: this.content.find('#min'),
        value: this.value[0],
        disabled: this.ports['inMin'].connected()
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
        value: this.value[1],
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

/** @inheritDoc */
visflow.RangeFilter.prototype.process = function() {
  var packs = [];
  [
    {portId: 'inMin', index: 0},
    {portId: 'inMax', index: 1}
  ].forEach(function(info) {
    var port = this.ports[info.portId];
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

    var val = pack.getOne();
    if (val == null) {
      visflow.error('unexpected null value in package of ', this.label);
    } else {
      this.value[index] = val;
    }
  }, this);

  if (!packs[0].compatible(packs[1])) {
    visflow.warning('incompatible constant types in ', this.label);
    // TODO(bowen): Promote constant type?
    return;
  }

  if (this.value[0] != null && this.value[1] != null &&
      this.value[0] > this.value[1]) {
    visflow.warning('minValue > maxValue in', this.label);
  }

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
visflow.RangeFilter.prototype.filter = function() {
  // Slow implementation: Linear scan
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var items = inpack.items;
  var data = inpack.data;

  var result = [];
  for (var index in items) {
    var inRange = false;
    for (var dimIndex = 0; dimIndex < this.options.dims.length && !inRange;
         dimIndex++) {
      var value = data.values[index][this.options.dims[dimIndex]];
      if ((this.value[0] == null || value >= this.value[0]) &&
          (this.value[1] == null || value <= this.value[1])) {
        inRange = true;
      }
      if (inRange) {
        break;
      }
    }
    if (inRange) {
      result.push(index);
    }
  }
  var outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  outpack.filter(result);
};
