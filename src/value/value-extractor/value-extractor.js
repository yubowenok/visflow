/**
 * @fileoverview VisFlow value extractor module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.ValueExtractor = function(params) {
  visflow.ValueExtractor.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
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
      isConstants: true
    })
  };

  /**
   * Last applied data id. Default is empty data (0).
   * @protected {number}
   */
  this.lastDataId = 0;
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
visflow.ValueExtractor.prototype.defaultOptions = function() {
  return {
    // Dimensions from which to extract values.
    dims: []
  };
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.serialize = function() {
  var result = visflow.ValueExtractor.base.serialize.call(this);
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.deserialize = function(save) {
  visflow.ValueExtractor.base.deserialize.call(this, save);
  this.lastDataId = save.lastDataId;
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.initPanel = function(container) {
  visflow.ValueExtractor.base.initPanel.call(this, container);
  var units = [
    {
      constructor: visflow.MultipleSelect,
      params: {
        container: container.find('#dims'),
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
    }
  ];
  this.initInterface(units);
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.showDetails = function() {
  visflow.ValueExtractor.base.showDetails.call(this);
  var units = [
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
    }
  ];
  this.initInterface(units);
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.process = function() {
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  if (inpack.type === 'constants')
    return visflow.error('constants in connected to value extractor');

  // Overwrite to maintain references in the downflow.
  $.extend(outpack, new visflow.Constants());

  if (inpack.isEmpty()) {
    return;
  }

  if (inpack.data.dataId != this.lastDataId) {
    this.lastDataId = inpack.data.dataId;
  }

  var items = inpack.items;
  var values = inpack.data.values;
  var allValues = {};
  for (var index in items) {
    this.options.dims.forEach(function(dim) {
      var value = values[index][dim];
      allValues[value] = true;
    });
  }

  _.allKeys(allValues).map(function(val) {
    // insert each value into constants
    outpack.add(val);
  }, this);
};

/**
 * Handles interface parameter changes.
 */
visflow.ValueExtractor.prototype.parameterChanged = function() {
  this.process();
  this.pushflow();
  this.show();
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};
