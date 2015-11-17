/**
 * @fileoverview VisFlow rendering property mapping module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.PropertyMapping = function(params) {
  visflow.PropertyMapping.base.constructor.call(this, params);

  this.inPorts = [
    new visflow.Port(this, 'in', 'in-single', 'D')
  ];
  this.outPorts = [
    new visflow.Port(this, 'out', 'out-multiple', 'D')
  ];
  this.prepare();

  this.dimension = null;
  this.mapping = null;
  this.colorScale = null;
  this.numberScale = [];  // [l, r]
  this.colorScales = null;

  this.properties = {};
};

visflow.utils.inherit(visflow.PropertyMapping, visflow.Node);

/** @inheritDoc */
visflow.PropertyMapping.prototype.ICON_CLASS =
    'dataflow-property-mapping-icon dataflow-square-icon';
/** @inheritDoc */
visflow.PropertyMapping.prototype.SHAPE_NAME = 'property-mapping'; // dedicate shape

/**
 * Mapping from user visible properties to their underlying property types.
 * @protected {!Object<string>}
 */
visflow.PropertyMapping.prototype.mappingTypes = {
  color: 'color',
  border: 'color',
  size: 'number',
  width: 'number',
  opacity: 'number'
};

/**
 * Mapping from property type to value ranges.
 * @protected {!Object<!Array<number>>}
 */
visflow.PropertyMapping.prototype.mappingRange = {
  size: [0, 1E9],
  width: [0, 1E9],
  opacity: [0, 1]
};

/**
 * Scrolling delta for different types of properties.
 * @protected {!Object<number>}
 */
visflow.PropertyMapping.prototype.mappingScrollDelta = {
  size: 0.5,
  width: 0.1,
  opacity: 0.05
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.contextmenuDisabled = {
  options: true
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.serialize = function() {
  var result = visflow.PropertyMapping.base.serialize.call(this);

  result.dimension = this.dimension;
  result.mapping = this.mapping;
  result.colorScale = this.colorScale;
  result.numberScale = this.numberScale;

  return result;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.deserialize = function(save) {
  visflow.PropertyMapping.base.deserialize.call(this, save);

  this.dimension = save.dimension;
  this.mapping = save.mapping;
  this.colorScale = save.colorScale;
  this.numberScale = save.numberScale;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.showDetails = function() {
  visflow.PropertyMapping.base.showDetails.call(this); // call parent settings

  var node = this;
  // select dimension
  this.selectDimension = new visflow.Select({
    id: 'dimension',
    label: 'Dimension',
    target: this.jqview,
    list: this.prepareDimensionList(),
    value: this.dimension,
    labelWidth: 75,
    placeholder: 'Select',
    containerWidth: this.jqview.width() - 75,
    change: function(event) {
      //console.log('change dim');
      var unitChange = event.unitChange;
      node.dimension = unitChange.value;
      node.pushflow();
    }
  });

  // select mapping
  this.selectMapping = new visflow.Select({
    id: 'mapping',
    label: 'Mapping',
    target: this.jqview,
    list: this.prepareMappingList(),
    value: this.mapping,
    labelWidth: 75,
    placeholder: 'Select',
    containerWidth: this.jqview.width() - 75,
    change: function(event) {
      var unitChange = event.unitChange;
      node.mapping = unitChange.value;
      node.show();
      node.pushflow();
    }
  });

  var mappingType = this.mappingTypes[this.mapping];

  if (mappingType == 'color') {
    if (this.inputNumberScale != null) {
      this.inputNumberScale[0].remove();
      this.inputNumberScale[1].remove();
      this.inputNumberScale = null;
    }
    // a select list of color scales
    this.selectColorScale = new visflow.ColorScale({
      id: 'scale',
      label: 'Scale',
      target: this.jqview,
      labelWidth: 75,
      value: this.colorScale,
      placeholder: 'No Scale',
      containerWidth: this.jqview.width() - 75,
      change: function(event) {
        //console.log('scale change');
        var unitChange = event.unitChange;
        node.colorScale = unitChange.value;
        node.updatePorts();
        node.pushflow();
      }
    });
  } else if (mappingType == 'number'){  // number
    if (this.selectColorScale != null) {
      this.selectColorScale.remove();
      this.selectColorScale = null;
    }
    // two input boxes of range
    this.inputNumberScale = [];
    [
      [0, 'Min'],
      [1, 'Max']
    ].map(function(unit){
      var id = unit[0];
      var input = this.inputNumberScale[id] = new visflow.Input({
        id: id,
        label: unit[1],
        target: this.jqview,
        value: this.inputNumberScale[id],
        labelWidth: 40,
        containerWidth: 50,
        accept: 'float',
        range: this.mappingRange[this.mapping],
        scrollDelta: this.mappingScrollDelta[this.mapping]
      });
      if (this.numberScale[id] != null) {
        input.setValue(this.numberScale[id]);
        this.numberScale[id] = input.value; // value maybe fixed
      }
      input.change(function(event){
        var unitChange = event.unitChange;
        if (unitChange.value != null) {
          node.numberScale[id] = unitChange.value;
        } else {
          node.numberScale[id] = null;
        }
        node.pushflow();
      });
      if (id == 1) {  // make appear in the same line, HACKY...
        input.jqunit.css({
          left: 95,
          top: 65,
          position: 'absolute'
        });
      }
    }, this);
  }
};

/**
 * Prepares the dimension list for selecting mapping dimension.
 * @return {!Array<{value: string|number, text: string>}
 */
visflow.PropertyMapping.prototype.prepareDimensionList = function() {
  var dims = this.ports['in'].pack.data.dimensions;
  var list = [];
  for (var i in dims) {
    list.push({
      value: i,
      text: dims[i]
    });
  }
  return list;
};

/**
 * Prepares the mapping list of the property mapping.
 * @return {!Array<{value: string, text: string}>}
 */
visflow.PropertyMapping.prototype.prepareMappingList = function() {
  var list = [];
  ['color', 'border', 'size', 'width', 'opacity'].map(function(mapping) {
    list.push({
      value: mapping,
      text: mapping
    });
  }, this);
  return list;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack,
      data = inpack.data;
  outpack.copy(inpack);

  var mappingType = this.mappingTypes[this.mapping];
  if (this.dimension == null || this.mapping == null)
    return;

  if (mappingType == 'color') {
    if (this.colorScale == null // no scale selected
      || visflow.viewManager.colorScales[this.colorScale] == null) // scales async not ready
      return;
  } else if (mappingType == 'number') {
    if (this.numberScale == null)
      return;
  }

  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack,
      data = inpack.data;
  var dataScale, propertyScale, scale;

  if (mappingType == 'color')
    scale = visflow.viewManager.colorScales[this.colorScale];
  else if (mappingType == 'number')
    scale = {
      domain: [0, 1],
      range: this.numberScale
    };


  if (data.dimensionTypes[this.dimension] != 'string') {
    // get min/max value
    var minValue = null, maxValue = null;
    for (var index in inpack.items) {
      var item = inpack.items[index],
          value = data.values[index][this.dimension];
      if (minValue == null) {
        minValue = value;
        maxValue = value;
      }
      if (value < minValue)
        minValue = value;
      if (value > maxValue)
        maxValue = value;
    }
    dataScale = d3.scale.linear()
      .domain([minValue, maxValue])
      .range([0, 1]);
    propertyScale = d3.scale.linear()
      .domain(scale.domain)
      .range(scale.range);
  } else {
    var values = {};
    for (var index in inpack.items) {
      var item = inpack.items[index],
          value = data.values[index][this.dimension];
      values[value] = true;
    }
    values = _.allKeys(values);
    var indexes = d3.range(scale.range.length);
    dataScale = d3.scale.ordinal()
      .domain(values)
      .range(indexes);
    propertyScale = d3.scale.linear()
      .domain(indexes)
      .range(scale.range);
  }
  var newitems = {};
  for (var index in inpack.items) {
    var value = data.values[index][this.dimension];
    var property = {};
    property[this.mapping] = propertyScale(dataScale(value));
    newitems[index] = {
      properties: _.extend({}, inpack.items[index].properties, property)
    };
  }
  // cannot reuse old items
  outpack.items = newitems;
};
