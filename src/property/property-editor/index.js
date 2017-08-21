/**
 * @fileoverview VisFlow rendering property editor module.
 */

/**
 * @param {visflow.params.Node} params
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

_.inherit(visflow.PropertyEditor, visflow.Property);

/** @inheritDoc */
visflow.PropertyEditor.prototype.serialize = function() {
  var result = visflow.PropertyEditor.base.serialize.call(this);
  return result;
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
  this.properties().forEach(function(p) {
    var value = this.options[p];
    if (value != null) {
      setProps[p] = value;
    }
  }, this);
  for (var itemIndex in inpack.items) {
    var index = +itemIndex;
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
  this.numericProperties().forEach(function(prop) {
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
  if (adjusted || source != 'node') {
    this.show();
  }
  if (adjusted || source != 'panel') {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/**
 * Sets a particular rendering property.
 * @param {string} property
 * @param {string|number} value
 */
visflow.PropertyEditor.prototype.setProperty = function(property, value) {
  this.options[property] = value;
  this.parameterChanged('external');
};

/**
 * Sets a group of rendering properties. This is equivalent to calling
 * setProperty on each property respectively (but slightly more efficient as
 * parameterChanged is only fired once).
 * @param {!Object<string, (number|string)>} properties
 *     If a value is '+' or '-', then increase or decrease the previous value.
 */
visflow.PropertyEditor.prototype.setProperties = function(properties) {
  for (var property in properties) {
    var value = properties[property];
    if (value == '+' || value == '-') {
      if (visflow.property.isColorProperty(value)) {
        visflow.warning('cannot increase/decrease color');
        continue;
      }
      if (this.options[property] == undefined) {
        this.options[property] = this.defaultProperties()[property];
      } else {
        var preValue = this.options[property];
        this.options[property] = value == '+' ?
          preValue + visflow.property.SCROLL_DELTAS[property] :
          preValue - visflow.property.SCROLL_DELTAS[property];
      }
    } else {
      this.options[property] = value;
    }
  }
  setTimeout(function() {
    this.parameterChanged('external');
  }.bind(this), visflow.const.QUEUE_DELAY); // push to queue
};
