/**
 * @fileoverview VisFlow data source.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.DataSource = function(params) {
  visflow.DataSource.base.constructor.call(this, params);

  /**
   * Data file name.
   * @type {string}
   */
  this.dataFile = '';

  /**
   * Human readable data name.
   * @type {string}
   */
  this.dataName = 'No data loaded';

  /**
   * Created DataTable.
   * @private {DataTable}
   */
  this.table_;

  /**
   * Whether to use server data or online data.
   * @protected {boolean}
   */
  this.useServerData = true;

  /**
   * Online data set URL.
   * @protected {string}
   */
  this.onlineDataURL = '';

  /**
   * Copy of parsed data, used for switching between non-crossing and crossing.
   * @private {!visflow.TabularData}
   */
  this.data_ = new visflow.Data();

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

/** @private @const {number} */
visflow.DataSource.prototype.ERROR_LIMIT_ = 100;

/** @inheritDoc */
visflow.DataSource.prototype.DEFAULT_OPTIONS = {
  // Whether to use data crossing.
  crossing: false,
  // Dimensions used for crossing. -1 is index.
  crossingDims: [-1],
  // Name for the attribute column in crossing.
  crossingName: 'attributes'
};

/** @inheritDoc */
visflow.DataSource.prototype.serialize = function() {
  var result = visflow.DataSource.base.serialize.call(this);
  result.dataFile = this.dataFile;
  result.dataName = this.dataName;
  result.useServerData = this.useServerData;
  result.onlineDataURL = this.onlineDataURL;
  return result;
};

/** @inheritDoc */
visflow.DataSource.prototype.deserialize = function(save) {
  visflow.DataSource.base.deserialize.call(this, save);

  if (save.dataSelected != null) {
    visflow.warning('older version data storage found, auto fixed');
    save.dataFile = save.dataSelected;
  }
  if (save.dataFile == 'none') {
    save.dataFile = '';
  }
  if (save.useServerData == null) {
    save.useServerData = true;
    save.onlineDataURL = '';
  }

  this.dataFile = save.dataFile;
  this.dataName = save.dataName;
  this.useServerData = save.useServerData;
  this.onlineDataURL = save.onlineDataURL;

  if (this.useServerData) {
    if (this.dataFile !== '') {
      this.loadData({
        name: this.dataName,
        file: this.dataFile
      });
    }
  } else {
    if (this.onlineDataURL !== '') {
      this.loadData({
        name: this.dataName,
        url: this.onlineDataURL
      });
    }
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
  container.find('#clear-data').click(this.clearData_.bind(this));

  this.createDataList_(container);

  var crossingToggle = new visflow.Checkbox({
    container: container.find('#crossing'),
    value: this.options.crossing,
    title: 'Crossing'
  });
  $(crossingToggle).on('visflow.change', function(event, value) {
    this.options.crossing = value;
    this.updateCrossing_();
  }.bind(this));

  var crossingDimsSelect = new visflow.EditableList({
    container: container.find('#crossing-dims'),
    list: [{id: -1, text: 'index'}].concat(this.getDimensionList(this.data_)),
    listTitle: 'Key(s)',
    addTitle: 'Add Dimension',
    selected: this.options.crossingDims,
    allowClear: false
  });
  $(crossingDimsSelect).on('visflow.change', function(event, dims) {
    this.options.crossingDims = dims;
    if (this.options.crossing) {
      this.updateCrossing_();
    }
  }.bind(this));

  var crossingNameInput = new visflow.Input({
    container: container.find('#crossing-name'),
    value: this.options.crossingName,
    title: 'Column Name'
  });
  $(crossingNameInput).on('visflow.change', function(event, value) {
    this.options.crossingName = value;
    if (this.options.crossing) {
      this.updateCrossing_();
    }
  }.bind(this));

  if (!this.options.crossing) {
    container.find('#crossing-section').hide();
  }
};

/**
 * Creates a data list according to the currently loaded data.
 * @param {!jQuery} container
 */
visflow.DataSource.prototype.createDataList_ = function(container) {

};

/**
 * Updates the data crossing option.
 * @private
 */
visflow.DataSource.prototype.updateCrossing_ = function() {
  if (visflow.optionPanel.isOpen) {
    var panelContainer = visflow.optionPanel.contentContainer();
    if (!this.options.crossing) {
      panelContainer.find("#crossing-section").hide();
      $.extend(this.ports['out'].pack, new visflow.Package(this.data_));
      visflow.flow.propagate(this);
      return;
    }
    panelContainer.find("#crossing-section").show();
  }

  var result = visflow.parser.cross(this.data_, this.options.crossingDims,
    this.options.crossingName);
  if (!result.success) {
    visflow.error('failed to cross data:', result.msg);
    $.extend(this.ports['out'].pack, new visflow.Package());
    visflow.flow.propagate(this);
    return;
  }

  var data = new visflow.Data(result.data);
  if (data.type != 'empty') {
    visflow.flow.registerData(data);
  }
  $.extend(this.ports['out'].pack, new visflow.Package(data));
  visflow.flow.propagate(this);
};

/**
 * Updates the active section in the dialog based on server/online data is used.
 * @param {!jQuery} dialog
 * @private
 */
visflow.DataSource.prototype.updateActiveSections_ = function(dialog) {
  var server = dialog.find('.server');
  var online = dialog.find('.online');
  var btnServer = dialog.find('#btn-server');
  var btnOnline = dialog.find('#btn-online');
  if (this.useServerData) {
    server.removeClass('disabled');
    btnServer.hide();
    online.addClass('disabled');
    btnOnline.show();
  } else {
    online.removeClass('disabled');
    btnServer.show();
    server.addClass('disabled');
    btnOnline.hide();
  }
};

/**
 * Creates the load data dialog.
 * @private
 */
visflow.DataSource.prototype.loadDataDialog_ = function() {
  visflow.dialog.create({
    template: './src/data-source/load-data.html',
    complete: function(dialog) {

      dialog.find('.to-tooltip').tooltip({
        delay: this.TOOLTIP_DELAY_
      });

      var select = dialog.find('select');

      var dataFile = '';
      var dataName = '';
      var dataURL = '';
      var confirm = dialog.find('#confirm');

      // Checks whether upload options have been all set.
      var uploadable = function() {
        var allSet;
        if (this.useServerData) {
          allSet = dataFile !== '' && dataName !== '';
        } else {
          allSet = dataURL !== '' && dataName !== '';
        }
        confirm.prop('disabled', !allSet);
      }.bind(this);

      confirm.click(function() {
        if (this.useServerData) {
          this.loadData({
            name: dataName,
            file: dataFile
          });
        } else {
          this.loadData({
            name: dataName,
            url: dataURL
          });
        }
      }.bind(this));

      $.get('./server/list-data.php')
        .done(function(res) {
          if (!res.success) {
            visflow.error('cannot list server data:', res.msg);
            return;
          }
          var table = dialog.find('table');
          this.listDataTable_(table, res.filelist);
          table
            .on('select.dt', function() {
              dataName = table.find('tr.selected').children()
                .first().text();
              dataFile = table.find('tr.selected').children()
                .first().next().text();
              uploadable();
            })
            .on('deselect.dt', function() {
              dataName = '';
              dataFile = '';
              uploadable();
            });
        }.bind(this))
        .fail(function() {
          visflow.error('cannot list server data');
        });

      dialog.find('.online #data-name').keyup(function(event) {
        dataName = $(event.target).val();
        uploadable();
      }.bind(this));
      dialog.find('.online #url').keyup(function(event) {
        dataURL = $(event.target).val();
        uploadable();
      }.bind(this));

      dialog.find('#btn-server').click(function() {
        this.useServerData = true;
        this.updateActiveSections_(dialog);
        uploadable();
      }.bind(this));
      dialog.find('#btn-online').click(function() {
        this.useServerData = false;
        this.updateActiveSections_(dialog);
        uploadable();
      }.bind(this));
      this.updateActiveSections_(dialog);

      dialog.find('#btn-upload').click(function(event) {
        event.stopPropagation();
        visflow.upload.setComplete(this.loadDataDialog_.bind(this));
        visflow.upload.dialog();
      }.bind(this));
    }.bind(this)
  });
};

/**
 * Clears the currently loaded data.
 * @private
 */
visflow.DataSource.prototype.clearData_ = function() {
  // setData_ will propagate.
  this.setData_({
    name: 'No data loaded',
    url: '',
    file: ''
  });
};

/**
 * Loads the data with given file and name from the server.
 * @param {!{
 *   name: string,
 *   file: string=,
 *   url: string=
 * }} params
 *   file: Must be set when loading from server.
 *   url: Must be set when loading from online sources.
 */
visflow.DataSource.prototype.loadData = function(params) {
  if (!this.useServerData && params.url.substr(0, 4) != 'http') {
    params.url = 'http://' + params.url;
  }
  var url = this.useServerData ? './server/data/' + params.file : params.url;
  $.get(url)
    .done(function(result) {
      visflow.assert(result != null);
      // CSV parser will report error itself.
      result = visflow.parser.csv(result);

      // Store a copy of parsed data, so that we can switch between crossing
      // and non-crossing.
      this.data_ = result;

      if (this.options.crossing) {
        this.updateCrossing_();
      } else {
        this.setData_(_(params).extend({
          data: result
        }));
      }
    }.bind(this))
    .fail(function(res, msg, error){
      visflow.error('cannot get data', msg,
          error.toString().substr(0, this.ERROR_LIMIT_));
    }.bind(this));
};

/**
 * Sets server data as the data source data.
 * @param {!{
 *   name: string,
 *   file: string=,
 *   url: string=,
 *   data: !visflow.TabularData
 * }} params
 */
visflow.DataSource.prototype.setData_ = function(params) {
  this.dataName = params.name;
  if (this.useServerData) {
    this.dataFile = params.file;
  } else {
    this.onlineDataURL = params.url;
  }

  this.content.find('#data-name').text(this.dataName);
  if (visflow.optionPanel.isOpen) {
    $('#option-panel').find('#data-name').text(this.dataName);
  }

  // Add data name and file info to the params object.
  _(params.data).extend({
    name: this.dataName,
    file: this.useServerData ? this.dataFile : 'online'
  });

  var data = new visflow.Data(params.data);
  if (data.type != 'empty') {
    visflow.flow.registerData(data);
  }
  // Overwrite data object (to keep the same reference).
  $.extend(this.ports['out'].pack, new visflow.Package(data));
  visflow.flow.propagate(this);
};

/**
 * Shows a table with list of data sets stored on the server.
 * @param {!jQuery} table
 * @param {!Array<{filename: string, mtime: number}>} fileList
 * @private
 */
visflow.DataSource.prototype.listDataTable_ = function(table, fileList) {
  if (this.table_) {
    this.table_.destroy();
  }
  this.table_ = table.DataTable({
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
