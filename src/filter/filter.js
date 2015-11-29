/**
 * @fileoverview VisFlow filter base module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Filter = function(params) {
  visflow.Filter.base.constructor.call(this, params);

  /**
   * Dimension chosen to be filtered on.
   * @protected {number}
   */
  this.dim = 0;

  /**
   * Last processed data id. By default it is empty data.
   * @protected {number}
   */
  this.lastDataId = 0;
};

visflow.utils.inherit(visflow.Filter, visflow.Node);

/** @inheritDoc */
visflow.Filter.prototype.RESIZABLE = false;

/** @protected @const {string} */
visflow.Filter.prototype.NULL_VALUE_STRING = '-';

/** @inheritDoc */
visflow.Filter.prototype.init = function() {
  visflow.Filter.base.init.call(this);
  this.container.addClass('filter');
};

/** @inheritDoc */
visflow.Filter.prototype.serialize = function() {
  var result = visflow.Filter.base.serialize.call(this);
  result.dim = this.dim;
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.Filter.prototype.deserialize = function(save) {
  visflow.Filter.base.deserialize.call(this, save);
  this.dim = save.dim;
  this.lastDataId = save.lastDataId;
  if (this.dim == null) {
    this.dim = 0;
    visflow.warning('filter dim not saved');
  }
  if (this.lastDataId == null) {
    this.lastDataId = 0;
    visflow.warning('filter lastDataId not saved');
  }
};

/**
 * Handles data change event.
 */
visflow.Filter.prototype.dataChanged = function() {
  this.dim = 0;
  this.show();
};

/**
 * Handles input changes, e.g. dimension changed, filtering values changed.
 */
visflow.Filter.prototype.inputChanged = function() {
  this.process();
  this.pushflow();
  this.show();
};

/**
 * Filters the data by constraints. To be implemented in inheriting class.
 */
visflow.Filter.prototype.filter = function() {};


