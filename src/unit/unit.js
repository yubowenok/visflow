/**
 * @fileoverview VisFlow base UI unit class.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Unit = function(params) {
  if (params == null || params.id == null) {
    visflow.error('null params or params.id');
    return;
  }

  this.id = params.id;
  this.label = params.label != null ? params.label : '';
  this.value = params.value; // default value, usually for save
  this.target = params.target;

  // layout
  this.relative = params.relative;
  this.labelWidth = params.labelWidth;
  this.containerWidth = params.containerWidth;
  this.changeCallback = params.change != null ?
    params.change : function () {};
};

/** @inheritDoc */
visflow.Unit.prototype.prepare = function() {
  this.jqunit = $('<div></div>')
    .addClass('dataflow-unit');

  var jqlabel = this.jqlabel = $('<div></div>')
    .addClass('dataflow-unit-text')
    .text(this.label)
    .appendTo(this.jqunit);
  if (this.labelWidth != null)
    jqlabel.css('width', this.labelWidth);

  this.jqcontainer = $('<div></div>')
    .addClass('dataflow-unit-container')
    .appendTo(this.jqunit);
  if (this.labelWidth != null)
    this.jqcontainer.css('left', this.labelWidth);

  // shall set container width
  if (this.containerWidth != null)
    this.jqcontainer.css('width', this.containerWidth);

  if (this.relative) {
    var css = {
      display: 'block',
      position: 'initial',
      left: ''
    };
    this.jqlabel.css(css);
    this.jqcontainer.css(css);
  }

  if (this.target != null) {
    this.jqunit.appendTo(this.target);
  }
};

/**
 * Sets the value of the unit.
 * @param value
 * @param event
 */
visflow.Unit.prototype.setValue = function(value, event) {
};

/**
 * Sets the value change callback of the unit.
 * @param callback
 */
visflow.Unit.prototype.change = function(callback) {
  this.changeCallback = callback;
};

/** @inheritDoc */
visflow.Unit.prototype.remove = function() {
  this.jqunit.remove();
};
