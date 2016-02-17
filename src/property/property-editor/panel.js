/**
 * @fileoverview Property editor panel functions.
 */

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
