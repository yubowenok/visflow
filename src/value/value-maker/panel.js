/**
 * @fileoverview ValueMaker panel functions.
 */

/** @inheritDoc */
visflow.ValueMaker.prototype.initPanel = function(container) {
  visflow.ValueMaker.base.initPanel.call(this, container);
  this.panelElements = [
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#value'),
        value: this.valueString,
        title: 'Value'
      },
      change: function(event, valueString) {
        this.setValueString(valueString);
        this.parameterChanged();
      }
    }
  ];
};
