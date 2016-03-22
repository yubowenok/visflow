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
    'in': new visflow.MultiplePort({
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

_.inherit(visflow.Sampler, visflow.Filter);

/** @inheritDoc */
visflow.Sampler.prototype.showDetails = function() {
  visflow.Sampler.base.showDetails.call(this);

  var units = [
    // Dimension
    {
      constructor: visflow.Select,
      params: {
        container: this.content.find('#dim'),
        list: this.getDimensionList(null, true),
        selected: this.options.dim,
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};

/** @inheritDoc */
visflow.Sampler.prototype.process = function() {
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;
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

/** @inheritDoc */
visflow.Sampler.prototype.filter = function() {
  var inpack = /** @type {!visflow.Package} */(this.ports['in'].pack);
  var outpack = this.ports['out'].pack;
  var data = inpack.data;

  var itemGroups = inpack.groupItems(this.options.groupBy);
  var reversed = this.options.condition == 'last' ? -1 : 1;
  var result = [];
  itemGroups.forEach(function(groupItems) {
    var colValues = [];
    groupItems.forEach(function(index) {
      var val = this.options.dim == visflow.data.INDEX_DIM ?
        index : data.values[index][this.options.dim];
      colValues.push(val);
    }, this);
    colValues.sort(function(a, b) {
      return reversed * visflow.utils.compare(a, b);
    });

    if (this.options.unique) {
      colValues = _.uniq(colValues);
    }

    var count = this.options.mode == 'count' ? this.options.number :
      Math.ceil(this.options.number / 100 * colValues.length);
    count = Math.min(colValues.length, count);

    var acceptedVals = [];
    switch (this.options.condition) {
      case 'first':
      case 'last':
        acceptedVals = colValues.slice(0, count);
        break;
      case 'sampling':
        var i = 0;
        var percentage = this.options.number / 100;
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
        break;
    }
    acceptedVals = _.keySet(acceptedVals);
    groupItems.forEach(function(index) {
      var val = data.values[index][this.options.dim];
      if (val in acceptedVals) {
        result.push(index);
      }
    }, this);
  }, this);

  outpack.copy(inpack);
  outpack.filter(result);
};
