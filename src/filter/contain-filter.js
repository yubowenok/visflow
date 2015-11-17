/**
 * @fileoverview VisFlow contain filter module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.ContainFilter = function(params) {
  visflow.ContainFilter.base.constructor.call(this, params);

  this.inPorts = [
    new visflow.Port(this, 'inv', 'in-single', 'V', true),
    new visflow.Port(this, 'in', 'in-single', 'D')
  ];
  this.outPorts = [
    new visflow.Port(this, 'out', 'out-multiple', 'D')
  ];

  this.value = null;
  this.embedValue = null;
  this.inputMode = 'text';
  this.matchMode = 'exact';

  this.prepare();
};

visflow.utils.inherit(visflow.ContainFilter, visflow.Filter);

/** @inheritDoc */
visflow.ContainFilter.prototype.ICON_CLASS =
    'dataflow-contain-icon dataflow-square-icon';

/** @inheritDoc */
visflow.ContainFilter.prototype.serialize = function() {
  var result = visflow.ContainFilter.base.serialize.call(this);
  result.inputMode = this.inputMode;
  result.matchMode = this.matchMode;
  result.embedValue = this.embedValue;
  return result;
};

/** @inheritDoc */
visflow.ContainFilter.prototype.deserialize = function(save) {
  visflow.ContainFilter.base.deserialize.call(this, save);
  this.inputMode = save.inputMode;
  this.matchMode = save.matchMode;
  this.embedValue = save.embedValue;
  if (this.inputMode == null) {
    console.error('contain filter inputMode not saved');
    this.inputMode = 'text';
  }
  if (this.matchMode == null) {
    console.error('contain filter matchMode not saved');
    this.matchMode = 'exact';
  }
};

/** @inheritDoc */
visflow.ContainFilter.prototype.showDetails = function() {

  visflow.ContainFilter.base.showDetails.call(this); // call parent settings
  var node = this;
  $('<div>contains</div>')
    .css('padding-bottom', 3)
    .appendTo(this.jqview);

  $('<div><input id="v" style="width:80%"/></div>')
    .appendTo(this.jqview);

  this.jqvalue = this.jqview.find('#v')
    .addClass('dataflow-input dataflow-input-node')
    .val(this.value ? this.value : this.NULL_VALUE_STRING)
    .change(function(event) {
      node.embedValue = event.target.value;
      node.pushflow();
    });

  if (this.ports['inv'].connected())
    this.jqvalue.prop('disabled', true);
};

/** @inheritDoc */
visflow.ContainFilter.prototype.showOptions = function() {
  var node = this;

  this.selectInputMode = new visflow.Select({
    id: 'inputmode',
    label: 'Input Mode',
    target: this.jqoptions,
    list: [
      {
        value: 'text',
        text: 'Text'
      },
      {
        value: 'regex',
        text: 'Regular Expression'
      }
    ],
    value: this.inputMode,
    relative: true,
    change: function(event) {
      node.inputMode = event.unitChange.value;
      node.pushflow();
    }
  });

  this.selectMatchMode = new visflow.Select({
    id: 'matchmode',
    label: 'Match Mode',
    target: this.jqoptions,
    list: [
      {
        value: 'exact',
        text: 'Exact'
      },
      {
        value: 'substring',
        text: 'Substring'
      }
    ],
    value: this.matchMode,
    relative: true,
    change: function(event) {
      node.matchMode = event.unitChange.value;
      node.pushflow();
    }
  });
};

/** @inheritDoc */
visflow.ContainFilter.prototype.process = function() {
  var port = this.ports['inv'],
      pack;
  if (port.connected())
    pack = port.pack;
  else if (this.embedValue != null)
    pack = new visflow.Constants(this.embedValue);
  else
    pack = port.pack; // empty constants

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

  this.value = pack.getAll();

  this.jqvalue.val(this.value ? pack.stringify() : this.nullValueString);

  // do the actual filtering
  this.filter();
};

/** @inheritDoc */
visflow.ContainFilter.prototype.filter = function() {
  // slow implementation: linear scan
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack;
  var items = inpack.items,
      data = inpack.data,
      dim = parseInt(this.dimension);

  var result = [];
  for (var index in items) {
    var value = '' + data.values[index][dim],
        ok = 0;
    for (var j in this.value) {
      var pattern = this.value[j];

      if (this.inputMode == 'regex')
        pattern = RegExp(pattern);

      var m = value.match(pattern);
      if (m != null) {

        if (this.matchMode == 'exact' && m[0] === value ||
            this.matchMode == 'substring') {
           result.push(index);
           break;
         }
      }
    }
  }
  outpack.copy(inpack);
  outpack.filter(result);
};
