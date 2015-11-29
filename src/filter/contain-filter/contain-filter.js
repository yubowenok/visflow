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
    inVal: new visflow.Port(this, 'inVal', 'in-single', 'V', true),
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  /**
   * Filtering value applied.
   * @protected {!Array<number|string>}
   */
  this.value = null;

  /**
   * Filtering value specified by directly typing in the input boxes.
   * Type-in value is stored as string.
   * @protected {!Array<string>}
   */
  this.typeInValue = null;

  /**
   * Whether input is treated as normal text or regex.
   * 'text' or 'regex'
   * @protected {string}
   */
  this.mode = 'text';
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
visflow.ContainFilter.prototype.serialize = function() {
  var result = visflow.ContainFilter.base.serialize.call(this);
  result.mode = this.mode;
  result.typeInValue = this.typeInValue;
  return result;
};

/** @inheritDoc */
visflow.ContainFilter.prototype.deserialize = function(save) {
  visflow.ContainFilter.base.deserialize.call(this, save);
  this.mode = save.mode;
  this.typeInValue = save.typeInValue;
  if (this.mode == null) {
    visflow.warning('mode not saved in', this.label);
    this.mode = 'text';
  }
};

/** @inheritDoc */
visflow.ContainFilter.prototype.initPanel = function(container) {
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

  var inputVal = new visflow.Input({
    container: container.find('#val'),
    value: this.value,
    title: 'Value(s)',
    disabled: this.ports['inVal'].connected()
  });
  $(inputVal).on('visflow.change', function(event, value) {
    console.log(value);
    this.typeInValue = '' + value;
    this.inputChanged();
  }.bind(this));

  var modes = [
    {id: 'text', text: 'Text'},
    {id: 'regex', text: 'Regex'}
  ];
  var modeSelect = new visflow.Select({
    container: container.find('#input-mode'),
    list: modes,
    selected: this.mode,
    listTitle: 'Matching Mode'
  });
  $(modeSelect).on('visflow.change', function(event, mode) {
    this.mode = mode;
    this.inputChanged();
  }.bind(this));

};

/** @inheritDoc */
visflow.ContainFilter.prototype.showDetails = function() {
  visflow.ContainFilter.base.showDetails.call(this); // call parent settings

  var data = this.ports['in'].pack.data;

  var dim = this.content.find('#dim');
  var dimText = data.dimensions[this.dim] != null ? data.dimensions[this.dim] :
    'N/A';
  dim.text(dimText);

  var value = this.content.find('#val');
  value.text(this.value != null ? this.value : this.NULL_VALUE_STRING);
};

/** @inheritDoc */
visflow.ContainFilter.prototype.process = function() {
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  if (inpack.isEmpty()) {
    outpack.copy(inpack);
    return;
  }

  var port = this.ports['inVal'];
  var pack;
  if (port.connected()) {
    pack = port.pack;
  } else if (this.typeInValue != null) {
    pack = new visflow.Constants(this.typeInValue);
  } else {
    // Empty constants
    pack = port.pack;
  }

  this.value = pack.getAll();

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
    var value = '' + data.values[index][this.dim];
    for (var j in this.value) {
      var pattern = this.value[j];
      if (this.mode == 'regex') {
        pattern = RegExp(pattern);
      }
      var m = value.match(pattern);
      if (m != null) {
         result.push(index);
         break;
      }
    }
  }
  outpack.copy(inpack);
  outpack.filter(result);
};
