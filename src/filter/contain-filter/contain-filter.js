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

  _(this.options).extend(this.DEFAULT_OPTIONS);
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
  // Whether input is treated as normal text or regex.
  // 'text' or 'regex'.
  mode: 'text',
  // Matching target. 'full' or 'substring'.
  target: 'full',
  // Whether to ignore cases in matching.
  ignoreCases: true
};

/** @inheritDoc */
visflow.ContainFilter.prototype.serialize = function() {
  var result = visflow.ContainFilter.base.serialize.call(this);
  result.mode = this.options.mode;
  result.typeInValue = this.typeInValue;
  return result;
};

/** @inheritDoc */
visflow.ContainFilter.prototype.deserialize = function(save) {
  visflow.ContainFilter.base.deserialize.call(this, save);
  this.options.mode = save.mode;
  this.typeInValue = save.typeInValue;
};

/** @inheritDoc */
visflow.ContainFilter.prototype.initPanel = function(container) {
  var dimSelect = new visflow.Select({
    container: container.find('#dim'),
    list: this.getDimensionList(),
    selected: this.dim,
    listTitle: 'Filtering Dimension',
    selectTitle: this.ports['in'].pack.data.isEmpty() ?
        this.NO_DATA_STRING : null
  });
  $(dimSelect).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged();
  }.bind(this));

  var inputVal = new visflow.Input({
    container: container.find('#value'),
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
    container: container.find('#mode'),
    list: modes,
    selected: this.options.mode,
    listTitle: 'Matching Mode'
  });
  $(modeSelect).on('visflow.change', function(event, mode) {
    this.options.mode = mode;
    this.inputChanged();
  }.bind(this));

  var targets = [
    {id: 'full', text: 'Full String'},
    {id: 'substring', text: 'Substring'}
  ];
  var targetSelect = new visflow.Select({
    container: container.find('#target'),
    list: targets,
    selected: this.options.target,
    listTitle: 'Matching Target'
  });
  $(targetSelect).on('visflow.change', function(event, target) {
    this.options.target = target;
    this.inputChanged();
  }.bind(this));

  var ignoreCasesToggle = new visflow.Checkbox({
    container: container.find('#ignore-cases'),
    value: this.options.ignoreCases,
    title: 'Ignore Cases'
  });
  $(ignoreCasesToggle).on('visflow.change', function(event, value) {
    this.options.ignoreCases = value;
    this.inputChanged();
  }.bind(this));
};

/** @inheritDoc */
visflow.ContainFilter.prototype.showDetails = function() {
  visflow.ContainFilter.base.showDetails.call(this);

  var dimSelect = new visflow.Select({
    container: this.content.find('#dim'),
    list: this.getDimensionList(),
    selected: this.dim,
    selectTitle: this.ports['in'].pack.data.isEmpty() ?
        this.NO_DATA_STRING : null
  });
  $(dimSelect).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged();
  }.bind(this));

  var inputVal = new visflow.Input({
    container: this.content.find('#value'),
    value: this.value,
    disabled: this.ports['inVal'].connected()
  });
  $(inputVal).on('visflow.change', function(event, value) {
    this.typeInValue = '' + value;
    this.inputChanged();
  }.bind(this));
};

/** @inheritDoc */
visflow.ContainFilter.prototype.process = function() {
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
    var value = '' + data.values[index][this.dim];
    if (this.options.ignoreCases) {
      value = value.toLowerCase();
    }
    for (var j in this.value) {
      var pattern = this.value[j];
      if (this.options.ignoreCases) {
        pattern = pattern.toLowerCase();
      }
      if (this.options.mode == 'regex') {
        pattern = RegExp(pattern);
      }
      var m = value.match(pattern);
      if (m != null && (this.options.target == 'substring' || m[0] == value)) {
        result.push(index);
        break;
      }
    }
  }
  outpack.copy(inpack);
  outpack.filter(result);
};
