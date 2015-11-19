/**
 * @fileoverview VisFlow value extractor module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.ValueExtractor = function(params) {
  visflow.ValueExtractor.base.constructor.call(this, params);

  this.viewHeight = 40; // height + padding

  this.inPorts = [
    new visflow.Port(this, 'in', 'in-single', 'V')
  ];
  this.outPorts = [
    new visflow.Port(this, 'out', 'out-multiple', 'V', true)
  ];

  // overwrite with constants
  this.outPorts[0].pack = new visflow.Constants();

  this.dimension = null;

  this.lastDataId = 0;  // default empty data

  this.init()();
};

visflow.utils.inherit(visflow.ValueExtractor, visflow.Node);

/** @inheritDoc */
visflow.ValueExtractor.prototype.MINIMIZED_CLASS =
    'value-extractor-icon flat-icon';
/** @inheritDoc */
visflow.ValueExtractor.prototype.SHAPE_NAME = 'value-extractor';

/** @inheritDoc */
visflow.ValueExtractor.prototype.contextmenuDisabled = {
  options: true
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.serialize = function() {
  var result = visflow.ValueExtractor.base.serialize.call(this);
  result.dimension = this.dimension;
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.deserialize = function(save) {
  visflow.ValueExtractor.base.deserialize.call(this, save);
  this.dimension = save.dimension;
  this.lastDataId = save.lastDataId;
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.showDetails = function() {
  visflow.ValueExtractor.base.showDetails.call(this); // call parent settings

  var node = this;
  this.selectDimension = visflow.Select.new({
    id: 'dimension',
    label: 'Extract values from',
    target: this.container,
    relative: true,
    placeholder: 'Select',
    value: this.dimension,
    list: this.prepareDimensionList(),
    change: function(event) {
      var unitChange = event.unitChange;
      node.dimension = unitChange.value;
      node.pushflow();
    }
  });
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack;
  if (inpack.type === 'constants')
    return visflow.error('constants in connected to value extractor');

  // overwrite to maintain reference downflow
  $.extend(outpack, DataflowConstants.new());

  if (inpack.isEmpty()) {
    return;
  }

  if (inpack.data.dataId != this.lastDataId) {
    this.lastDataId = inpack.data.dataId;
    this.dimension = 0;
  }

  var items = inpack.items,
      values = inpack.data.values;
  var allValues = {};
  for (var index in items) {
    var value = values[index][this.dimension];
    allValues[value] = true;
  }

  _(allValues).allKeys().map(function(val) {
    // insert each value into constants
    outpack.add(val);
  }, this);
};
