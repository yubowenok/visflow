/**
 * @fileoverview VisFlow value extractor module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.ValueExtractor = function(params) {
  visflow.ValueExtractor.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'V', true)
  };

  /**
   * Dimension from which to extract constants.
   * @type {number}
   */
  this.dim = 0;

  /**
   * Last applied data id. Default is empty data (0).
   * @protected {number}
   */
  this.lastDataId = 0;

  this.ports['out'].pack = new visflow.Constants();
};

visflow.utils.inherit(visflow.ValueExtractor, visflow.Node);

/** @inheritDoc */
visflow.ValueExtractor.prototype.NODE_NAME = 'Value Extractor';
/** @inheritDoc */
visflow.ValueExtractor.prototype.NODE_CLASS = 'value-extractor';
/** @inheritDoc */
visflow.ValueExtractor.prototype.TEMPLATE =
  './src/value/value-extractor/value-extractor.html';
/** @inheritDoc */
visflow.ValueExtractor.prototype.PANEL_TEMPLATE =
  './src/value/value-extractor/value-extractor-panel.html';
/** @inheritDoc */
visflow.ValueExtractor.prototype.MIN_WIDTH = 120;
/** @inheritDoc */
visflow.ValueExtractor.prototype.MIN_HEIGHT = 53;
/** @inheritDoc */
visflow.ValueExtractor.prototype.MAX_HEIGHT = 53;

/** @protected @const {string} */
visflow.ValueExtractor.prototype.NO_DATA_STRING = 'No Data';

/** @inheritDoc */
visflow.ValueExtractor.prototype.serialize = function() {
  var result = visflow.ValueExtractor.base.serialize.call(this);
  result.dim = this.dim;
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.deserialize = function(save) {
  visflow.ValueExtractor.base.deserialize.call(this, save);
  this.dim = save.dim;
  this.lastDataId = save.lastDataId;

  if (this.dim == null) {
    this.dim = 0;
    visflow.warning('dim not saved in', this.label);
  }
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.initPanel = function(container) {
  visflow.ValueExtractor.base.initPanel.call(this, container);

  var dimSelect = new visflow.Select({
    container: container.find('#dim'),
    list: this.getDimensionList(),
    selected: this.dim,
    selectTitle: this.ports['in'].pack.data.isEmpty() ?
        this.NO_DATA_STRING : null
  });
  $(dimSelect).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged();
  });
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.showDetails = function() {
  visflow.ValueExtractor.base.showDetails.call(this); // call parent settings

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
  });
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack;
  if (inpack.type === 'constants')
    return visflow.error('constants in connected to value extractor');

  // Overwrite to maintain references in the downflow.
  $.extend(outpack, new visflow.Constants());

  if (inpack.isEmpty()) {
    return;
  }

  if (inpack.data.dataId != this.lastDataId) {
    this.lastDataId = inpack.data.dataId;
    this.dim = 0;
  }

  var items = inpack.items,
      values = inpack.data.values;
  var allValues = {};
  for (var index in items) {
    var value = values[index][this.dim];
    allValues[value] = true;
  }

  _(allValues).allKeys().map(function(val) {
    // insert each value into constants
    outpack.add(val);
  }, this);
};

/**
 * Handles input dimension changes.
 */
visflow.ValueExtractor.prototype.inputChanged = function() {
  this.process();
  this.pushflow();
  this.show();
  this.updatePanel(visflow.optionPanel.contentContainer());
};
