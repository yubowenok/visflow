/**
 * @fileoverview VisFlow rendering property mapping module.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Property}
 */
visflow.PropertyMapping = function(params) {
  visflow.PropertyMapping.base.constructor.call(this, params);

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
      isConstants: false
    })
  };

  /**
   * Dimension to be mapped.
   * @protected {number}
   */
  this.dim = 0;
};

_.inherit(visflow.PropertyMapping, visflow.Property);

/** @inheritDoc */
visflow.PropertyMapping.prototype.serialize = function() {
  var result = visflow.PropertyMapping.base.serialize.call(this);

  result.dim = this.dim;
  result.mapping = this.mapping;
  result.colorScaleId = this.colorScaleId;
  return result;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.deserialize = function(save) {
  visflow.PropertyMapping.base.deserialize.call(this, save);

  this.dim = save.dim;

  if (this.dim == null) {
    visflow.warning('dim not saved in', this.label);
    this.dim = 0;
  }
  if (this.options.mapping == null) {
    visflow.warning('mapping not saved in', this.label);
    this.options.mapping = 'color';
  }
  if (this.options.colorScaleId == null) {
    visflow.warning('colorScaleId not saved in', this.label);
    this.options.colorScaleId = 'redGreen';
  }
};

/**
 * Shows a user editable scale for color or number.
 * @param {!jQuery} scaleDiv
 * @param {string} source 'panel' or 'node'.
 * @private
 */
visflow.PropertyMapping.prototype.showEditableScale_ = function(scaleDiv,
                                                                source) {
  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];
  scaleDiv.children('*').hide();

  var units = [];

  if (mappingType == 'color') {
    var colorDiv = scaleDiv.children('#color').show();
    units.push({
      constructor: visflow.ColorScaleSelect,
      params: {
        container: colorDiv,
        selected: this.options.colorScaleId,
        listTitle: scaleDiv.hasClass('source-panel') ? 'Color Scale' : null
      },
      change: function(event, scaleId) {
        this.options.colorScaleId = scaleId;
        this.parameterChanged(source);
      }
    });
  } else if (mappingType == 'number') {
    var numberDiv = scaleDiv.children('#number').show();
    [
      {selector: '#min', index: 0},
      {selector: '#max', index: 1}
    ].forEach(function(info) {
        units.push({
          constructor: visflow.Input,
          params: {
            container: numberDiv.find(info.selector),
            accept: visflow.ValueType.FLOAT,
            range: visflow.property.MAPPING_RANGES[this.options.mapping],
            scrollDelta: visflow.property.SCROLL_DELTAS[this.options.mapping],
            value: this.options.numberRange[info.index]
          },
          change: function(event, value) {
            this.options.numberRange[info.index] = value;
            this.parameterChanged(source);
          }
        });
      }, this);
  }
  this.initInterface(units);
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.showDetails = function() {
  visflow.PropertyMapping.base.showDetails.call(this); // call parent settings

  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: this.content.find('#dim'),
        list: this.getDimensionList(),
        selected: this.dim,
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.dim = dim;
        this.parameterChanged('node');
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: this.content.find('#mapping'),
        list: visflow.property.MAPPINGS,
        selected: this.options.mapping
      },
      change: function(event, mapping) {
        this.options.mapping = mapping;
        this.showEditableScale_(this.content.find('#scale'), 'node');
        this.parameterChanged('node');
      }
    }
  ];

  this.initInterface(units);

  this.showEditableScale_(this.content.find('#scale'), 'node');
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.process = function() {
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;
  var items = inpack.items;
  var data = inpack.data;
  outpack.copy(inpack);

  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];

  var dataScale = visflow.scales.getScale(data, this.dim, items, [0, 1], {
    ordinalRange: true
  }).scale;
  var propScale;
  if (mappingType == 'color') {
    propScale = visflow.scales[this.options.colorScaleId].scale;
  } else if (mappingType == 'number') {
    propScale = d3.scaleLinear()
      .domain([0, 1])
      .range(this.options.numberRange);
  }

  var isOrdinal = visflow.scales[this.options.colorScaleId].isOrdinal;

  var newItems = {};
  for (var index in inpack.items) {
    var value = data.values[index][this.dim];
    var mappedDataValue;
    if (isOrdinal) {
      value = visflow.utils.hashString('' + value);
      mappedDataValue = value;
    } else {
      mappedDataValue = dataScale(value);
    }
    var prop = {};
    prop[this.options.mapping] = propScale(mappedDataValue);
    newItems[index] = {
      properties: _.extend({}, inpack.items[index].properties, prop)
    };
  }
  // Cannot reuse old items.
  outpack.items = newItems;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.adjustNumbers = function() {
  var adjusted = false;
  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];
  if (mappingType == 'number') {
    //
    var range = visflow.property.MAPPING_RANGES[this.options.mapping];
    if (this.options.numberRange[0] < range[0]) {
      this.options.numberRange[0] = range[0];
      adjusted = true;
    }
    if (this.options.numberRange[1] > range[1]) {
      this.options.numberRange[1] = range[1];
      adjusted = true;
    }
  }
  return adjusted;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.parameterChanged = function(source) {
  var adjusted = this.adjustNumbers();
  this.process();
  this.pushflow();
  // If number range is adjusted, we need to redraw both node and panel as the
  // inputs may be out-of-date.
  if (adjusted || source == 'panel') {
    this.show();
  }
  if (adjusted || source == 'node') {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};
