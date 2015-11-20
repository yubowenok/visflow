/**
 * @fileoverview VisFlow data source.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.DataSource = function(params) {
  visflow.DataSource.base.constructor.call(this, params);

  this.dataSelected = 'none'; // data identifier string
  this.dataName = null; // full data name, for human read

  /** @inheritDoc */
  this.ports = {
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };
};

visflow.utils.inherit(visflow.DataSource, visflow.Node);

/** @inheritDoc */
visflow.DataSource.prototype.NODE_CLASS = 'data-source';

/** @inheritDoc */
visflow.DataSource.prototype.contextmenuDisabled = {
  options: true
};

/** @inheritDoc */
visflow.DataSource.prototype.serialize = function() {
  var result = visflow.DataSource.base.serialize.call(this);
  result.dataSelected = this.dataSelected;
  result.dataName = this.dataName;
  return result;
};

/** @inheritDoc */
visflow.DataSource.prototype.deserialize = function(save) {
  visflow.DataSource.base.deserialize.call(this, save);
  if (save.dataSelected != 'none') {
    this.loadData(save.dataSelected, save.dataName);
  }
};

/** @inheritDoc */
visflow.DataSource.prototype.show = function() {
  visflow.DataSource.base.show.call(this); // call parent settings

  var container = this.container,
      node = this;

  visflow.assert(!this.options.minimized);

  $('<div>No data loaded</div>')
    .attr('id', 'data-name')
    .appendTo(this.content);

  // load data buttons
  $('<button>Load Data</button>')
    .addClass('btn btn-default btn-sm')
    .click(function(){
      visflow.dialog.create({
        template: './src/datasource/load-data.html',
        complete: function(dialog) {
          var select = dialog.find('select');
          select.select2();
          dialog.find('#confirm').click(function() {
            var data = select.select2('data')[0];
            node.loadData(data.id, data.text);
          });
        }
      });
    })
    .appendTo(this.content);

  if (this.dataName != null) {
    this.container.find('#data-name').text(this.dataName);
  }
};

/**
 * Loads the data with given name.
 * @param dataSelected
 * @param dataName
 */
visflow.DataSource.prototype.loadData = function(dataSelected, dataName) {
  var node = this;

  // add to async queue
  visflow.flow.asyncDataloadStart(this);

  if (dataSelected == 'none') {
    this.container.find('#data-name')
      .text('No data loaded');
    this.dataSelected = dataSelected;
    this.dataName = null;
    $.extend(node.ports['out'].pack, new visflow.Package());
    visflow.flow.asyncDataloadEnd();  // propagate null data
    return;
  }

  // TODO(bowen): re-use loaded data
  /*
  var data;
  if ((data = visflow.flow.data[dataSelected]) != null) {
    console.log('reused');
    node.dataSelected = dataSelected;
    node.dataName = dataName;
    node.container.find('#datahint').text(dataName);
    $.extend(node.ports['out'].pack, new visflow.Package(data));
    return;
  }
  */

  $.get('./data/' + dataSelected + '.json')
    .done(function(result) {
      if (result == null) {
        visflow.error('loaded data is null');
        return;
      }
      node.dataSelected = dataSelected;
      node.dataName = dataName;
      node.container.find('#data-name').text(dataName);

      var data = new visflow.Data(result);

      visflow.flow.registerData(data);

      // overwrite data object (to keep the same reference)
      $.extend(node.ports['out'].pack, new visflow.Package(data));

      // decrement async count
      visflow.flow.asyncDataloadEnd(); // push changes
    })
    .fail(function(){
      visflow.error('cannot get data (connection error)');
    });
};
