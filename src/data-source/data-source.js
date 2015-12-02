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

  /**
   * Data identifier.
   * @type {string}
   */
  this.dataSelected = 'none';

  /**
   * Human readable data name.
   * @type {string}
   */
  this.dataName = 'No data loaded';

  /** @inheritDoc */
  this.ports = {
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };
};

visflow.utils.inherit(visflow.DataSource, visflow.Node);

/** @inheritDoc */
visflow.DataSource.prototype.NODE_CLASS = 'data-source';
/** @inheritDoc */
visflow.DataSource.prototype.NODE_NAME = 'Data Source';
/** @inheritDoc */
visflow.DataSource.prototype.TEMPLATE = './src/data-source/data-source.html';
/** @inheritDoc */
visflow.DataSource.prototype.PANEL_TEMPLATE =
    './src/data-source/data-source-panel.html';
/** @inheritDoc */
visflow.DataSource.prototype.MIN_HEIGHT = 40;
/** @inheritDoc */
visflow.DataSource.prototype.MAX_HEIGHT = 40;

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
visflow.DataSource.prototype.showDetails = function() {
  visflow.DataSource.base.showDetails.call(this);
  if (this.dataName != null) {
    this.content.children('#data-name').text(this.dataName);
  }
};

/** @inheritDoc */
visflow.DataSource.prototype.interaction = function() {
  visflow.DataSource.base.interaction.call(this);

  this.content.children('button').click(this.loadDataDialog_.bind(this));
};

/** @inheritDoc */
visflow.DataSource.prototype.initPanel = function(container) {
  container.find('#data-name').text(this.dataName);
  container.find('#load-data').click(this.loadDataDialog_.bind(this));
};

/**
 * Creates the load data dialog.
 * @private
 */
visflow.DataSource.prototype.loadDataDialog_ = function() {
  visflow.dialog.create({
    template: './src/data-source/load-data.html',
    complete: function(dialog) {
      var select = dialog.find('select');
      select.select2();
      dialog.find('#confirm').click(function() {
        var data = select.select2('data')[0];
        this.loadData(data.id, data.text);
      }.bind(this));
    }.bind(this)
  });
};

/**
 * Loads the data with given name.
 * @param dataSelected
 * @param dataName
 */
visflow.DataSource.prototype.loadData = function(dataSelected, dataName) {
  // Add to async queue
  visflow.flow.asyncDataloadStart(this);

  if (dataSelected == 'none') {
    this.container.find('#data-name')
      .text('No data loaded');
    this.dataSelected = dataSelected;
    this.dataName = null;
    $.extend(this.ports['out'].pack, new visflow.Package());
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
      this.setData_(dataSelected, dataName, result);
      // Decrement async loading count.
      visflow.flow.asyncDataloadEnd(); // Push changes
    }.bind(this))
    .fail(function(){
      visflow.error('cannot get data (connection error)');
    });
};

/**
 * Sets the data source data.
 * @param {string} dataSelected
 * @param {string} dataName
 * @param {!visflow.TabularData} fetchedData
 */
visflow.DataSource.prototype.setData_ = function(dataSelected, dataName,
                                                 fetchedData) {
  this.dataSelected = dataSelected;
  this.dataName = dataName;
  this.content.find('#data-name').text(dataName);

  if (visflow.optionPanel.isOpen) {
    $('#option-panel').find('#data-name').text(dataName);
  }

  var data = new visflow.Data(fetchedData);

  visflow.flow.registerData(data);

  // overwrite data object (to keep the same reference)
  $.extend(this.ports['out'].pack, new visflow.Package(data));
};