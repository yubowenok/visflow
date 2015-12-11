/**
 * @fileoverview VisFlow sampler module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.Sampler = function(params) {
  visflow.Sampler.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.MultiplePort({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };
};

visflow.utils.inherit(visflow.Sampler, visflow.Filter);

/** @inheritDoc */
visflow.Sampler.prototype.TEMPLATE =
  './src/filter/sampler/sampler.html';
/** @inheritDoc */
visflow.Sampler.prototype.PANEL_TEMPLATE =
  './src/filter/sampler/sampler-panel.html';
/** @inheritDoc */
visflow.Sampler.prototype.NODE_NAME = 'Sampler';
/** @inheritDoc */
visflow.Sampler.prototype.NODE_CLASS = 'sampler';

/** @inheritDoc */
visflow.Sampler.prototype.MAX_HEIGHT = 60;
/** @inheritDoc */
visflow.Sampler.prototype.MIN_HEIGHT = 60;

/**
 * Condition for sampling.
 * @private @const {!Array<{id: string, text: string}>}
 */
visflow.Sampler.prototype.CONDITIONS_ = [
  {id: 'first', text: 'First / Minimum'},
  {id: 'last', text: 'Last / Maximum'},
  {id: 'sampling', text: 'Random Sampling'}
];

/**
 * Modes for band limiting.
 * @private @const {!Array<{id: string, text: string}>}
 */
visflow.Sampler.prototype.MODES_ = [
  {id: 'count', text: 'Count'},
  {id: 'percentage', text: 'Percentage'}
];

/** @inheritDoc */
visflow.Sampler.prototype.DEFAULT_OPTIONS = {
  // Dimension to be filtered on.
  dim: 0,
  // Filtering conditions, 'first', 'last' or 'sampling'.
  condition: 'first',
  // Filtering modes, 'count' or 'percentage'.
  mode: 'count',
  // Filtering count or percentage
  number: 5,
  // Group by dimension.
  groupBy: ''
};

/** @inheritDoc */
visflow.Sampler.prototype.initPanel = function(container) {
  var units = [
    // Group By
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#group-by'),
        list: this.getDimensionList(null, true),
        selected: this.options.groupBy,
        listTitle: 'Group By',
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.groupBy = dim;
        this.parameterChanged();
      }
    },
    // Dimension
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#dim'),
        list: this.getDimensionList(null, true),
        selected: this.options.dim,
        listTitle: 'Filtering Dimension',
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged();
      }
    },
    // Condition
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#condition'),
        list: this.CONDITIONS_,
        selected: this.options.condition,
        listTitle: 'Condition'
      },
      change: function (event, condition) {
        this.options.condition = condition;
        this.parameterChanged();
      }
    },
    // Mode
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#mode'),
        list: this.MODES_,
        selected: this.options.mode,
        listTitle: 'Mode'
      },
      change: function (event, mode) {
        this.options.mode = mode;
        this.parameterChanged();
      }
    },
    // Number
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#num'),
        value: this.options.number,
        scrollDelta: 1,
        accept: visflow.ValueType.INT,
        title: 'Number to Pass'
      },
      change: function (event, number) {
        this.options.number = number;
        this.parameterChanged();5
      }
    }
  ];
  this.initInterface(units);
};

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
  var inpack = this.ports['in'].pack;
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
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  var items = inpack.items;
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

    var count = this.options.mode == 'count' ? this.options.number :
      Math.ceil(this.options.number / 100 * colValues.length);
    count = Math.min(colValues.length, count);

    var acceptedVals = [];
    switch(this.options.condition) {
      case 'first':
      case 'last':
        acceptedVals = colValues.slice(0, count);
        break;
      case 'sampling':
        var i = 0;
        while(count > 0) {
          if (i == colValues.length) {
            i = 0;
            colValues = _(colValues).filter(function(val) {
              return val != null;
            });
          }
          var rand = Math.random();
          if (rand < this.options.number / 100) {
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
