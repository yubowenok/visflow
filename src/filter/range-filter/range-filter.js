/**
 * @fileoverview VisFlow range filter module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.RangeFilter = function(params) {
  visflow.RangeFilter.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    inMin: new visflow.Port(this, 'inMin', 'in-single', 'V', true),
    inMax: new visflow.Port(this, 'inMax', 'in-single', 'V', true),
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  /**
   * Filtering range applied.
   * @protected {!Array<number|string>}
   */
  this.value = [];

  /**
   * Filtering range values specified by directly typing in the input boxes.
   * Type-in values are stored as strings.
   * @protected {!Array<string>}
   */
  this.typeInValue = [];
};

visflow.utils.inherit(visflow.RangeFilter, visflow.Filter);

/** @inheritDoc */
visflow.RangeFilter.prototype.TEMPLATE =
    './src/filter/range-filter/range-filter.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.PANEL_TEMPLATE =
    './src/filter/range-filter/range-filter-panel.html';
/** @inheritDoc */
visflow.RangeFilter.prototype.NODE_NAME = 'Range Filter';
/** @inheritDoc */
visflow.RangeFilter.prototype.NODE_CLASS = 'range-filter';

/** @inheritDoc */
visflow.RangeFilter.prototype.serialize = function() {
  var result = visflow.RangeFilter.base.serialize.call(this);
  result.value = this.value;
  result.typeInValue = this.typeInValue;
  return result;
};

/** @inheritDoc */
visflow.RangeFilter.prototype.deserialize = function(save) {
  visflow.RangeFilter.base.deserialize.call(this, save);
  this.value = save.value;
  this.typeInValue = save.typeInValue;
  if (this.typeInValue == null) {
    visflow.warning('typeInValue not saved');
    this.typeInValue = [];
  }
};

/** @inheritDoc */
visflow.RangeFilter.prototype.init = function() {
  visflow.RangeFilter.base.init.call(this);
};

/** @inheritDoc */
visflow.RangeFilter.prototype.initPanel = function(container) {
  var dimensionList = this.getDimensionList();
  var dimSelect = new visflow.Select({
    container: container.find('#dim'),
    list: dimensionList,
    selected: this.dim,
    listTitle: 'Filtering Dimension'
  });
  $(dimSelect).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged();
  }.bind(this));

  var minValue = new visflow.Input({
    container: container.find('#min'),
    value: this.value[0],
    title: 'Min Value',
    disabled: this.ports['inMin'].connected()
  });
  $(minValue).on('visflow.change', function(event, value) {
    this.typeInValue[0] = '' + value;
    this.inputChanged();;
  }.bind(this));

  var maxValue = new visflow.Input({
    container: container.find('#max'),
    value: this.value[1],
    title: 'Max Value',
    disabled: this.ports['inMax'].connected()
  });
  $(maxValue).on('visflow.change', function(event, value) {
    this.typeInValue[1] = '' + value;
    this.inputChanged();
  }.bind(this));
};

/** @inheritDoc */
visflow.RangeFilter.prototype.showDetails = function() {
  visflow.RangeFilter.base.showDetails.call(this);

  var data = this.ports['in'].pack.data;

  var dim = this.content.find('#dim');
  var dimText = data.dimensions[this.dim] != null ? data.dimensions[this.dim] :
      'N/A';
  dim.text(dimText);

  var min = this.content.find('#min');
  min.text(this.value[0] != null ? this.value[0] : this.NULL_VALUE_STRING);

  var max = this.content.find('#max');
  max.text(this.value[1] != null ? this.value[1] : this.NULL_VALUE_STRING);
};

/** @inheritDoc */
visflow.RangeFilter.prototype.process = function() {
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  if (inpack.isEmpty()) {
    outpack.copy(inpack);
    return;
  }

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
      } else if (this.typeInValue[index] != null) {
        pack = new visflow.Constants(this.typeInValue[index]);
      } else {
        // Empty pack.
        pack = port.pack;
      }
      packs[index] = pack;

      this.value[index] = pack.getOne();
    }, this);

  if (!packs[0].compatible(packs[1])) {
    visflow.warning('incompatible constant types in ', this.label);
    // TODO(bowen): Promote constant type?
    return;
  }

  if (this.value[0] != null && this.value[1] != null &&
      this.value[0] > this.value[1]) {
    visflow.warning('minValue > maxValue in', this.label);
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
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;

  var result = [];
  for (var index in items) {
    var value = data.values[index][this.dim];
    var inRange = true;
    if (this.value[0] != null && value < this.value[0]
      || this.value[1] != null && value > this.value[1]) {
      inRange = false;
    }
    if (inRange) {
      result.push(index);
    }
  }
  var outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  outpack.filter(result);
};
