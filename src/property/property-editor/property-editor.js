/**
 * @fileoverview VisFlow rendering property editor module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Property}
 */
visflow.PropertyEditor = function(params) {
  visflow.PropertyEditor.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };

  // Save edited rendering properties in options.
  _(this.options).extend({
    properties: {
      color: null,
      border: null,
      width: null,
      size: null,
      opacity: null
    }
  });
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
visflow.PropertyEditor.prototype.serialize = function() {
  var result = visflow.PropertyEditor.base.serialize.call(this);
  return result;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.deserialize = function(save) {
  visflow.PropertyEditor.base.deserialize.call(this, save);
  if (this.options.properties == null) {
    visflow.error('properties not saved in ', this.label);
    this.options.properties = {};
  }
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.initPanel = function(container) {
  [
    {selector: '#color', property: 'color', title: 'Color'},
    {selector: '#border', property: 'border', title: 'Border'}
  ].forEach(function(info) {
      var colorPicker = new visflow.ColorPicker({
        container: container.find(info.selector),
        colorPickerContainer: container,
        color: this.options.properties[info.property],
        title: info.title
      });
      $(colorPicker).on('visflow.change', function(event, color) {
        this.options.properties[info.property] = color;
        this.inputChanged('panel');
      }.bind(this));
    }, this);

  [
    {selector: '#width', property: 'width', title: 'Width'},
    {selector: '#size', property: 'size', title: 'Size'},
    {selector: '#opacity', property: 'opacity', title: 'Opacity'}
  ].forEach(function(info) {
      var input = new visflow.Input({
        container: container.find(info.selector),
        value: this.options.properties[info.property],
        title: info.title,
        accept: 'float',
        range: visflow.property.MAPPING_RANGES[info.property],
        scrollDelta: visflow.property.SCROLL_DELTAS[info.property]
      });
      $(input).on('visflow.change', function(event, value) {
        this.options.properties[info.property] = value;
        this.inputChanged('panel');
      }.bind(this));
    }, this);
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.showDetails = function() {
  visflow.PropertyEditor.base.showDetails.call(this); // call parent settings

  [
    {selector: '#color', property: 'color'},
    {selector: '#border', property: 'border'}
  ].forEach(function(info) {
    var colorPicker = new visflow.ColorPicker({
      container: this.content.find(info.selector),
      color: this.options.properties[info.property]
    });
    $(colorPicker).on('visflow.change', function(event, color) {
      this.options.properties[info.property] = color;
      this.inputChanged('node');
    }.bind(this));
  }, this);

  [
    {selector: '#width', property: 'width'},
    {selector: '#size', property: 'size'},
    {selector: '#opacity', property: 'opacity'}
  ].forEach(function(info) {
    var input = new visflow.Input({
      container: this.content.find(info.selector),
      value: this.options.properties[info.property],
      accept: 'float',
      range: visflow.property.MAPPING_RANGES[info.property],
      scrollDelta: visflow.property.SCROLL_DELTAS[info.property]
    });
    $(input).on('visflow.change', function(event, value) {
      this.options.properties[info.property] = value;
      this.inputChanged('node');
    }.bind(this));
  }, this);
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.process = function() {
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  var newItems = {};
  var setProps = {};
  for (var p in this.options.properties) {
    var value = this.options.properties[p];
    if (value != null) {
      setProps[p] = value;
    }
  }
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
  ['width', 'size', 'opacity'].forEach(function(prop) {
    var value = this.options.properties[prop];
    var range = visflow.property.MAPPING_RANGES[prop];
    if (value < range[0]) {
      value = range[0];
      adjusted = true;
    }
    if (value > range[1]) {
      value = range[1];
      adjusted = true;
    }
    this.options.properties[prop] = value;
  }, this);
  return adjusted;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.inputChanged = function(source) {
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
