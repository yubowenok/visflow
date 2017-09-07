/**
 * @fileoverview VisFlow sampler module.
 */

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.Sampler = function(params) {
  visflow.Sampler.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.MultiSubsetPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'out': new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };
};

_.inherit(visflow.Sampler, visflow.Filter);

/** @inheritDoc */
visflow.Sampler.prototype.showDetails = function() {
  visflow.Sampler.base.showDetails.call(this);

  var uiElements = [
    // Dimension
    {
      constructor: visflow.Select,
      params: {
        container: this.content.find('#dim'),
        list: this.getDimensionList(null, true),
        selected: this.options.dim,
        selectTitle: this.getDataInPort().pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    }
  ];

  this.showUiElements(uiElements);
};

/** @inheritDoc */
visflow.Sampler.prototype.processSync = function() {
  var inpack = /** @type {!visflow.Subset} */(this.getDataInPort().pack);
  var outpack = this.getDataOutPort().pack;
  if (inpack.isEmpty()) {
    outpack.copy(inpack);
    return;
  }

  if (this.lastDataId != inpack.data.dataId) {
    this.lastDataId = inpack.data.dataId;
    this.dataChanged();
  }

  // Do the actual filtering.
  this.filter();
};

/**
 * Samples the subset with a given specification.
 * @param {visflow.Sampler.Spec} spec
 * @param {!visflow.Subset} pack
 * @return {!Array<number>} Resulting subset as array.
 */
visflow.Sampler.filter = function(spec, pack) {
  var result = [];
  var itemGroups = pack.groupItems(spec.groupBy);
  var reversed = spec.condition == visflow.Sampler.Condition.LAST ? -1 : 1;
  var dim = spec.dim;

  itemGroups.forEach(function(groupItems) {
    var colValues = [];
    groupItems.forEach(function(itemIndex) {
      var index = +itemIndex;
      var val = pack.getValue(index, dim);
      colValues.push(val);
    }, this);
    colValues.sort(function(a, b) {
      return reversed * visflow.utils.compare(a, b);
    });

    if (spec.unique) {
      colValues = _.uniq(colValues);
    }

    var count = spec.mode == visflow.Sampler.Mode.COUNT ?
      spec.number :
      Math.ceil(spec.number / 100 * colValues.length);
    count = Math.min(colValues.length, count);

    var acceptedVals = [];
    switch (spec.condition) {
      case visflow.Sampler.Condition.FIRST:
      case visflow.Sampler.Condition.LAST:
        acceptedVals = colValues.slice(0, count);
        break;
      case visflow.Sampler.Condition.SAMPLING:
        var i = 0;
        var percentage = spec.number / 100;
        while (count > 0) {
          if (i == colValues.length) {
            i = 0;
            colValues = _.filter(colValues, function(val) {
              return val != null;
            });
          }
          var rand = Math.random();
          if (rand < percentage) {
            acceptedVals.push(colValues[i]);
            colValues[i] = null;
            count--;
          }
          i++;
        }
        // Last batch of filtering
        colValues = _.filter(colValues, function(val) {
          return val != null;
        });
        break;
    }
    acceptedVals = _.keySet(acceptedVals);
    groupItems.forEach(function(itemIndex) {
      var index = +itemIndex;
      var val = pack.getValue(index, dim);
      if (val in acceptedVals) {
        result.push(index);
      }
    });
  });
  return result;
};

/** @inheritDoc */
visflow.Sampler.prototype.filter = function() {
  var inpack = /** @type {!visflow.Subset} */(this.getDataInPort().pack);
  var outpack = this.getDataOutPort().pack;

  var result = visflow.Sampler.filter({
    dim: this.options.dim,
    number: this.options.number,
    unique: this.options.unique,
    groupBy: this.options.groupBy,
    mode: this.options.mode,
    condition: this.options.condition
  }, inpack);

  outpack.copy(inpack);
  outpack.filter(result);
};

/**
 * Sets the filtering rules for the sampler by passing a spec.
 * @param {visflow.Sampler.Spec} spec
 */
visflow.Sampler.prototype.setSpec = function(spec) {
  this.options.dim = spec.dim;
  this.options.number = spec.number;
  this.options.unique = false; // TODO(bowen)
  this.options.groupBy = spec.groupBy;
  this.options.mode = spec.mode;
  this.options.condition = spec.condition;

  this.parameterChanged();
};
