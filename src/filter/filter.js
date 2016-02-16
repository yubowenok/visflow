/**
 * @fileoverview VisFlow filter base module.
 */

/**
 * @param {!Object} params
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
visflow.Filter.prototype.MIN_HEIGHT = 95;
/** @inheritDoc */
visflow.Filter.prototype.MAX_HEIGHT = 95;

/** @protected @const {string} */
visflow.Filter.prototype.NO_DATA_STRING = 'No Data';

/** @inheritDoc */
visflow.Filter.prototype.init = function() {
  visflow.Filter.base.init.call(this);
  this.container.addClass('filter');
};

/** @inheritDoc */
visflow.Filter.prototype.serialize = function() {
  var result = visflow.Filter.base.serialize.call(this);
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.Filter.prototype.deserialize = function(save) {
  visflow.Filter.base.deserialize.call(this, save);
  this.lastDataId = save.lastDataId;
  if (this.lastDataId == null) {
    this.lastDataId = 0;
    visflow.warning('filter lastDataId not saved');
  }
};

/**
 * Handles data change event.
 */
visflow.Filter.prototype.dataChanged = function() {
  this.show();
};

/**
 * Handles interface changes, e.g. dimension changed, filtering values changed.
 */
visflow.Filter.prototype.parameterChanged = function() {
  this.pushflow();
  this.show();
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/**
 * Filters the data by constraints. To be implemented in inheriting class.
 */
visflow.Filter.prototype.filter = function() {};


