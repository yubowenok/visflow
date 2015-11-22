/**
 * @fileoverview VisFlow range filter module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Filter}
 */
visflow.RangeFilter = function(params) {
  visflow.RangeFilter.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    inv0: new visflow.Port(this, 'inv0', 'in-single', 'V', true),
    inv1: new visflow.Port(this, 'inv1', 'in-single', 'V', true),
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  this.value = [];
  this.embedValue = [];
  this.jqvalue = [];

  this.init();
};

visflow.utils.inherit(visflow.RangeFilter, visflow.Filter);

/** @inheritDoc */
visflow.RangeFilter.prototype.MINIMIZED_CLASS =
    'range-icon square-icon';

/** @inheritDoc */
visflow.RangeFilter.prototype.serialize = function() {
  var result = visflow.RangeFilter.base.serialize.call(this);
  result.embedValue = this.embedValue;
  return result;
};

/** @inheritDoc */
visflow.RangeFilter.prototype.deserialize = function(save) {
  visflow.RangeFilter.base.deserialize.call(this, save);
  this.embedValue = save.embedValue;
  if (this.embedValue == null) {
    visflow.error('embedValue not saved');
    this.embedValue = [];
  }
};

/** @inheritDoc */
visflow.RangeFilter.prototype.showDetails = function() {

  visflow.RangeFilter.base.showDetails.call(this); // call parent settings

  var node = this;

  $('<div>on</div>')
    .css('padding', 5)
    .prependTo(this.container);

  $('<div>[ <input id="v0" style="width:40%"/> , ' +
      '<input id="v1" style="width:40%"/> ]</div>')
    .prependTo(this.container);
  [0, 1].map(function(id) {
    this.jqvalue[id] = this.container.find('#v' + id);
    this.jqvalue[id]
      .addClass('input input-node')
      .val(this.value[id] != null ? this.value[id] : this.nullValueString)
      .change(function(event) {
        var value = event.target.value;
        node.embedValue[id] = value;
        node.pushflow();
      });
    if (this.ports['inv' + id].connected())
      this.jqvalue[id].prop('disabled', true);
  }, this);
};

/** @inheritDoc */
visflow.RangeFilter.prototype.process = function() {
  var pack = [];
  [0, 1].map(function(id) {
    var port = this.ports['inv' + id];
    if (port.connected())
      pack[id] = port.pack;
    else if (this.embedValue[id] != null)
      pack[id] = new visflow.Constants(this.embedValue[id]);
    else
      pack[id] = port.pack;
    this.value[id] = pack[id].getOne();
    this.jqvalue[id].val(this.value[id] != null ?
        this.value[id] : this.NULL_VALUE_STRING);
  }, this);

  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack;
  if (inpack.isEmpty() || this.dimension == null) {
    outpack.copy(inpack);
    return;
  }

  if (this.lastDataId != inpack.data.dataId) {
    this.dimension = 0;
    this.lastDataId = inpack.data.dataId;
  }

  // TODO promote constant type?
  if (!pack[0].compatible(pack[1])) {
    return visflow.viewManager.tip(
      'incompatible constant types passed to range filter',
      this.container.offset()
    );
  }

  if (this.value[0] != null && this.value[1] != null &&
      this.value[0] > this.value[1]) {
    this.value[0] = this.value[1] = null;
    visflow.viewManager.tip(
      'value1 > value2 in range filter',
      this.container.offset()
    );
  }

  if (inpack.data.dataId != this.lastDataId) {
    this.lastDataId = inpack.data.dataId;
    this.dimension = inpack.isEmpty() ? null : 0;
  }

  // do the actual filtering
  this.filter();
};

/** @inheritDoc */
visflow.RangeFilter.prototype.filter = function() {
  // slow implementation: linear scan
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data,
      dim = parseInt(this.dimension);

  var result = [];
  for (var index in items) {
    var value = data.values[index][dim],
        ok = 1;
    if (this.value[0] != null && value < this.value[0]
      || this.value[1] != null && value > this.value[1])
      ok = 0;
    if (ok) {
      result.push(index);
    }
  }
  var outpack = this.ports['out'].pack;
  outpack.copy(inpack);
  outpack.filter(result);
};