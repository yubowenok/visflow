/**
 * @fileoverview VisFlow rendering property editor module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.PropertyEditor = function(params) {
  visflow.PropertyEditor.base.constructor.call(this, params);

  this.inPorts = [
    new visflow.Port(this, 'in', 'in-single', 'D')
  ];
  this.outPorts = [
    new visflow.Port(this, 'out', 'out-multiple', 'D')
  ];
  this.prepare();

  // nothing is set by default
  this.properties = {};
};

visflow.utils.inherit(visflow.PropertyEditor, visflow.Node);

/** @inheritDoc */
visflow.PropertyEditor.prototype.ICON_CLASS =
    'property-editor-icon square-icon';

/** @inheritDoc */
visflow.PropertyEditor.prototype.SHAPE_NAME = 'property-editor';

/** @inheritDoc */
visflow.PropertyEditor.prototype.contextmenuDisabled = {
  options: true
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.serialize = function() {
  var result = visflow.PropertyEditor.base.serialize.call(this);
  result.properties = this.properties;
  return result;
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.deserialize = function(save) {
  visflow.PropertyEditor.base.deserialize.call(this, save);
  this.properties = save.properties;
  if (this.properties == null) {
    visflow.error('properties not saved in property editor');
    this.properties = {};
  }
  for (var key in this.properties) {
    if (this.properties[key] == '' || this.properties[key] == null) {
      visflow.error('null/empty property key saved');
      delete this.properties[key];
    }
  }
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.showDetails = function() {
  visflow.PropertyEditor.base.showDetails.call(this); // call parent settings

  var node = this;
  // color and border
  [
    ['Color', visflow.ColorPicker],
    ['Border', visflow.ColorPicker],
    ['Width', visflow.Input, 'float', [0, 1E9], 0.1],
    ['Size', visflow.Input, 'float', [0, 1E9], 0.5],
    ['Opacity', visflow.Input, 'float', [0, 1], 0.05]
  ].map(function(unit) {
    var id = unit[0].toLowerCase();
    var input = unit[1].new({
      id: id,
      label: unit[0],
      target: this.jqview,
      labelWidth: 60,
      accept: unit[2],
      range: unit[3],
      scrollDelta: unit[4]
    });
    if (this.properties[id] != null) {
      input.setValue(this.properties[id]);
    }
    input.change(function(event){
      var unitChange = event.unitChange;
      if (unitChange.value != null) {
        node.properties[unitChange.id] = unitChange.value;
      } else {
        // the property is null, and thus removed
        // otherwise downflow will get null svg value
        delete node.properties[unitChange.id];
      }
      node.pushflow();
    });
  }, this);
};

/** @inheritDoc */
visflow.PropertyEditor.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  var newitems = {};
  for (var index in inpack.items) {
    newitems[index] = {
      properties: _.extend({}, inpack.items[index].properties, this.properties)
    };
  }
  // cannot reuse old items
  outpack.items = newitems;
};
