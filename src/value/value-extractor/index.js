/**
 * @fileoverview VisFlow value extractor module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Value}
 */
visflow.ValueExtractor = function(params) {
  visflow.ValueExtractor.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.SubsetPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.MultiConstantPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };

  /**
   * Last applied data id. Default is empty data.
   * @protected {string}
   */
  this.lastDataId = visflow.data.EMPTY_DATA_ID;
};

_.inherit(visflow.ValueExtractor, visflow.Value);

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
visflow.ValueExtractor.prototype.showDetails = function() {
  visflow.ValueExtractor.base.showDetails.call(this);
  var uiElements = [
    {
      constructor: visflow.MultipleSelect,
      params: {
        container: this.content.find('#dims'),
        list: this.getDimensionList(),
        selected: this.options.dims,
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
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
  this.showUiElements(uiElements);
};

/** @inheritDoc */
visflow.ValueExtractor.prototype.processSync = function() {
  var inpack = this.getDataInPort().getSubset();
  var outpack = this.getConstantOutPort().pack;
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
  this.pushflow();
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/**
 * Sets the dimension to be extracted.
 * @param {!Array<number>} dims
 */
visflow.ValueExtractor.prototype.setDimensions = function(dims) {
  this.options.dims = dims;
  this.parameterChanged();
};
