/**
 * @fileoverview VisFlow filter base module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Filter = function(params) {
  visflow.Filter.base.constructor.call(this, params);

  this.viewHeight = 90; // height + padding
  this.dimension = null;

  this.lastDataId = 0;  // default empty data
};

visflow.utils.inherit(visflow.Filter, visflow.Node);

/** @protected @const {string} */
visflow.Filter.prototype.NULL_VALUE_STRING = '-';

/** @inheritDoc */
visflow.Filter.prototype.SHAPE_NAME = 'longflat';

/** @inheritDoc */
visflow.Filter.prototype.serialize = function() {
  var result = visflow.Filter.base.serialize.call(this);
  result.dimension = this.dimension;
  result.lastDataId = this.lastDataId;
  return result;
};

/** @inheritDoc */
visflow.Filter.prototype.deserialize = function(save) {
  visflow.Filter.base.deserialize.call(this, save);
  this.dimension = save.dimension;
  this.lastDataId = save.lastDataId;
};

/** @inheritDoc */
visflow.Filter.prototype.showDetails = function() {
  visflow.Filter.base.showDetails.call(this);

  this.jqview
    .css('text-align', 'center');

  var node = this;
  this.selectDimension = new visflow.Select({
    id: 'dimension',
    list: this.prepareDimensionList(),
    value: this.dimension,
    relative: true,
    placeholder: 'Select',
    change: function(event){
      node.dimension = event.target.value;
      if (node.dimension == '')
        node.dimension = null;
      node.pushflow();
    }
  });
  this.selectDimension.jqunit
    .appendTo(this.jqview);
};

/**
 * Filters the data by constraints. To be implemented in inheriting class.
 */
visflow.Filter.prototype.filter = function() {};


