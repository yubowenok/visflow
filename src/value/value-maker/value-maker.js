/**
 * @fileoverview VisFlow value maker module.
 */

'use strict';

/**
 * @param {visflow.Node.Params} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.ValueMaker = function(params) {
  visflow.ValueMaker.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: true
    })
  };

  /**
   * User typed in value string.
   * @protected {string}
   */
  this.valueString = '';

  /**
   * Parsed value as constants.
   * @protected {visflow.Constants}
   */
  this.value = new visflow.Constants('' + this.valueString);
  this.ports['out'].pack = this.value;
};

visflow.utils.inherit(visflow.ValueMaker, visflow.Node);

/** @inheritDoc */
visflow.ValueMaker.prototype.NODE_NAME = 'Value Maker';
/** @inheritDoc */
visflow.ValueMaker.prototype.NODE_CLASS = 'value-maker';
/** @inheritDoc */
visflow.ValueMaker.prototype.TEMPLATE =
    './src/value/value-maker/value-maker.html';
/** @inheritDoc */
visflow.ValueMaker.prototype.PANEL_TEMPLATE =
    './src/value/value-maker/value-maker-panel.html';
/** @inheritDoc */
visflow.ValueMaker.prototype.MIN_WIDTH = 120;
/** @inheritDoc */
visflow.ValueMaker.prototype.MIN_HEIGHT = 53;
/** @inheritDoc */
visflow.ValueMaker.prototype.MAX_HEIGHT = 53;

/** @inheritDoc */
visflow.ValueMaker.prototype.serialize = function() {
  var result = visflow.ValueMaker.base.serialize.call(this);
  result.valueString = this.valueString;
  return result;
};

/** @inheritDoc */
visflow.ValueMaker.prototype.deserialize = function(save) {
  visflow.ValueMaker.base.deserialize.call(this, save);
  this.setValueString(save.valueString);
};

/** @inheritDoc */
visflow.ValueMaker.prototype.initPanel = function(container) {
  visflow.ValueMaker.base.initPanel.call(this, container);
  var units = [
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
  this.initInterface(units);
};

/** @inheritDoc */
visflow.ValueMaker.prototype.showDetails = function() {
  visflow.ValueMaker.base.showDetails.call(this);
  var units = [
    {
      constructor: visflow.Input,
      params: {
        container: this.content.find('#value'),
        value: this.valueString
      },
      change: function(event, valueString) {
        this.setValueString(valueString);
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};

/**
 * Handles interface parameter changes.
 */
visflow.ValueMaker.prototype.parameterChanged = function() {
  this.process();
  this.show();
  this.pushflow();
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/**
 * Sets the value string.
 * @param {string} str
 */
visflow.ValueMaker.prototype.setValueString = function(str) {
  if (str == this.valueString) {
    return;
  }

  this.valueString = str;
  this.value = new visflow.Constants('' + str);

  $.extend(this.ports['out'].pack, this.value);
};
