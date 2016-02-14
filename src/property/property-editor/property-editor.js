/**
 * @fileoverview VisFlow rendering property editor module.
 */

'use strict';

/**
 * @param {visflow.Node.Params} params
 * @constructor
 * @extends {visflow.Property}
 */
visflow.PropertyEditor = function(params) {
  visflow.PropertyEditor.base.constructor.call(this, params);

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
};

visflow.utils.inherit(visflow.PropertyEditor, visflow.Property);

/** @inheritDoc */
visflow.PropertyEditor.prototype.NODE_CLASS = 'property-editor';
/** @inheritDoc */
visflow.PropertyEditor.prototype.NODE_NAME = 'Property Editor';
/** @inheritDoc */
visflow.PropertyEditor.prototype.TEMPLATE =
  './src/property/property-editor/property-editor.html';
/** @inheritDoc */
visflow.PropertyEditor.prototype.PANEL_TEMPLATE =
  './src/property/property-editor/property-editor-panel.html';

/** @inheritDoc */
visflow.PropertyEditor.prototype.defaultOptions = function() {
  return {
    color: null,
    border: null,
    width: null,
    size: null,
    opacity: null
  };
};

/**
 * @return {!Array<string>}
 * @private
 */
visflow.PropertyEditor.prototype.properties_ = function() {
  return [
    'color',
    'border',
    'width',
    'size',
    'opacity'
  ];
};

/**
 * @return {!Array<string>}
 * @private
 */
visflow.PropertyEditor.prototype.numericProperties_ = function() {
  return [
    'width',
    'size',
    'opacity'
  ];
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.serialize = function() {
  var result = visflow.PropertyEditor.base.serialize.call(this);
  return result;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.initPanel = function(container) {
  var units = [];
  [
    {selector: '#color', property: 'color', title: 'Color'},
    {selector: '#border', property: 'border', title: 'Border'}
  ].forEach(function(info) {
      units.push({
        constructor: visflow.ColorPicker,
        params: {
          container: container.find(info.selector),
          colorPickerContainer: container,
          color: this.options[info.property],
          title: info.title
        },
        change: function(event, color) {
          this.options[info.property] = color;
          this.parameterChanged('panel');
        }
      });
    }, this);
  [
    {selector: '#width', property: 'width', title: 'Width'},
    {selector: '#size', property: 'size', title: 'Size'},
    {selector: '#opacity', property: 'opacity', title: 'Opacity'}
  ].forEach(function(info) {
      units.push({
        constructor: visflow.Input,
        params: {
          container: container.find(info.selector),
          value: this.options[info.property],
          title: info.title,
          accept: visflow.ValueType.FLOAT,
          range: visflow.property.MAPPING_RANGES[info.property],
          scrollDelta: visflow.property.SCROLL_DELTAS[info.property]
        },
        change: function(event, value) {
          this.options[info.property] = value;
          this.parameterChanged('panel');
        }
      });
    }, this);

  this.initInterface(units);
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.showDetails = function() {
  visflow.PropertyEditor.base.showDetails.call(this); // call parent settings

  var units = [];

  [
    {selector: '#color', property: 'color'},
    {selector: '#border', property: 'border'}
  ].forEach(function(info) {
    units.push({
      constructor: visflow.ColorPicker,
      params: {
        container: this.content.find(info.selector),
        color: this.options[info.property]
      },
      change: function(event, color) {
        this.options[info.property] = color;
        this.parameterChanged('node');
      }
    });
  }, this);

  [
    {selector: '#width', property: 'width'},
    {selector: '#size', property: 'size'},
    {selector: '#opacity', property: 'opacity'}
  ].forEach(function(info) {
    units.push({
      constructor: visflow.Input,
      params: {
        container: this.content.find(info.selector),
        value: this.options[info.property],
        accept: visflow.ValueType.FLOAT,
        range: visflow.property.MAPPING_RANGES[info.property],
        scrollDelta: visflow.property.SCROLL_DELTAS[info.property]
      },
      change: function(event, value) {
        this.options[info.property] = value;
        this.parameterChanged('node');
      }
    });
  }, this);
  this.initInterface(units);
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.process = function() {
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  var newItems = {};
  var setProps = {};
  this.properties_().forEach(function(p) {
    var value = this.options[p];
    if (value != null) {
      setProps[p] = value;
    }
  }, this);
  for (var index in inpack.items) {
    var prop = _.extend(
      {},
      inpack.items[index].properties,
      setProps
    );
    newItems[index] = {
      properties: prop
    };
  }
  // Cannot reuse old items.
  outpack.items = newItems;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.adjustNumbers = function() {
  var adjusted = false;
  this.numericProperties_().forEach(function(prop) {
    var value = /** @type {number} */(this.options[prop]);
    var range = visflow.property.MAPPING_RANGES[prop];
    if (value < range[0]) {
      value = range[0];
      adjusted = true;
    }
    if (value > range[1]) {
      value = range[1];
      adjusted = true;
    }
    this.options[prop] = value;
  }, this);
  return adjusted;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.parameterChanged = function(source) {
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
