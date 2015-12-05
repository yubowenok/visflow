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
   * Data file name.
   * @type {string}
   */
  this.dataFile = 'none';

  /**
   * Human readable data name.
   * @type {string}
   */
  this.dataName = 'No data loaded';

  /** @inheritDoc */
  this.ports = {
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
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
  result.dataFile = this.dataFile;
  result.dataName = this.dataName;
  return result;
};

/** @inheritDoc */
visflow.DataSource.prototype.deserialize = function(save) {
  visflow.DataSource.base.deserialize.call(this, save);
  if (save.dataSelected != null) {
    visflow.warning('older version data storage found, auto fixed');
    save.dataFile = save.dataSelected;
  }
  if (save.dataFile != 'none') {
    this.loadData(save.dataFile, save.dataName);
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

      var dataFile = null;
      var dataName = null;
      var confirm = dialog.find('#confirm').prop('disabled', true);
      confirm.click(function() {
        this.loadData(dataFile, dataName);
      }.bind(this));

      $.get('./server/list-data.php')
        .done(function(res) {
          if (!res.success) {
            visflow.error('cannot list server data:', res.msg);
            return;
          }
          var table = dialog.find('table');
          this.listDataTable_(table, res.filelist);
          table.on('select.dt', function() {
            dataName = table.find('tr.selected').children()
              .first().text();
            dataFile = table.find('tr.selected').children()
              .first().next().text();
            confirm.prop('disabled', false);
          });
        }.bind(this))
        .fail(function() {
          visflow.error('cannot list server data');
        });
    }.bind(this)
  });
};

/**
 * Loads the data with given name.
 * @param {string} dataFile
 * @param {string} dataName
 */
visflow.DataSource.prototype.loadData = function(dataFile, dataName) {
  // Add to async queue
  visflow.flow.asyncDataloadStart(this);

  if (dataFile == 'none') {
    this.container.find('#data-name')
      .text('No data loaded');
    this.dataFile = dataFile;
    this.dataName = null;
    $.extend(this.ports['out'].pack, new visflow.Package());
    visflow.flow.asyncDataloadEnd();  // propagate null data
    return;
  }

  $.get('./server/data/' + dataFile) //
    .done(function(result) {
      visflow.assert(result != null);
      // CSV parser will report error itself.
      result = visflow.parser.csv(result);

      this.setData_(dataFile, dataName, result);
      // Decrement async loading count.
      visflow.flow.asyncDataloadEnd(); // Push changes
    }.bind(this))
    .fail(function(){
      visflow.error('cannot get data (connection error)');
    });
};

/**
 * Sets the data source data.
 * @param {string} dataFile
 * @param {string} dataName
 * @param {!visflow.TabularData} fetchedData
 */
visflow.DataSource.prototype.setData_ = function(dataFile, dataName,
                                                 fetchedData) {
  this.dataFile = dataFile;
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

/**
 * Shows a table with list of data sets stored on the server.
 * @param {!jQuery} table
 * @param {!Array<{filename: string, mtime: number}>} fileList
 * @private
 */
visflow.DataSource.prototype.listDataTable_ = function(table, fileList) {
  table.DataTable({
    data: fileList,
    select: 'single',
    pagingType: 'full',
    pageLength: 5,
    lengthMenu: [5, 10, 20],
    order: [
      [2, 'desc']
    ],
    columns: [
      {title: 'Data Name', data: 'dataname'},
      {title: 'File Name', data: 'filename'},
      {title: 'Last Modified', data: 'mtime'}
    ],
    columnDefs: [
      {
        render: function (lastModified) {
          return (new Date(lastModified)).toLocaleString();
        },
        targets: 2
      }
    ]
  });
};
