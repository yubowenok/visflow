/**
 * @fileoverview VisFlow data source.
 */

/**
 * TODO(bowen): use params typedefs?
 * @typedef {!Object}
 */
visflow.params.DataSource;

/**
 * @param {visflow.params.DataSource} params
 * @constructor
 * @extends {visflow.SubsetNode}
 */
visflow.DataSource = function(params) {
  visflow.DataSource.base.constructor.call(this, params);

  /**
   * Data array.
   * @type {!Array<visflow.data.Info>}
   */
  this.data = [];

  /**
   * Copy of parsed data, used for switching between non-transpose and
   * transpose.
   * @protected {!Array<?visflow.TabularData>}
   */
  this.rawData = [];

  /**
   * Created DataTable.
   * @private {DataTables|undefined}
   */
  this.table_ = undefined;

  /** @inheritDoc */
  this.ports = {
    out: new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false,
      fromPort: ''
    })
  };
};

_.inherit(visflow.DataSource, visflow.SubsetNode);


/** @inheritDoc */
visflow.DataSource.prototype.serialize = function() {
  var result = visflow.DataSource.base.serialize.call(this);
  result.data = this.data;
  return result;
};

/** @inheritDoc */
visflow.DataSource.prototype.deserialize = function(save) {
  visflow.DataSource.base.deserialize.call(this, save);

  save = /** @type {!visflow.save.DataSource} */(save);

  if (save.data == null) {
    save.data = [
      {
        id: '',
        name: save.dataName,
        file: save.dataFile
      }
    ];
  }
  this.data = save.data;

  var counter = 0;
  this.data.forEach(function(dataInfo) {
    if (isNaN(parseInt(dataInfo.id, 10))) {
      counter++;
    }
  });
  // Check whether all older version data has been converted.
  var convertComplete = function() {
    if (!counter) {
      // Start loading data.
      this.loadData();
    }
  }.bind(this);
  var converting = counter;
  this.data.forEach(function(dataInfo) {
    // backward compatibility, finding data id with data names
    if (isNaN(parseInt(dataInfo.id, 10))) {
      $.post(visflow.url.DATA_ID, {
        fileName: dataInfo.file
      }).done(function(id) {
        dataInfo.id = id;
      }).fail(function(res) {
        visflow.error('data for older version diagram not found:',
          res.responseText);
      }).always(function() {
        counter--;
        convertComplete();
      });
    }
  });
  if (!converting) {
    // New version of diagram. Start loading data directly.
    this.loadData();
  }
};

/** @inheritDoc */
visflow.DataSource.prototype.showDetails = function() {
  visflow.DataSource.base.showDetails.call(this);
  this.showNodeDataList_();
};

/** @inheritDoc */
visflow.DataSource.prototype.interaction = function() {
  visflow.DataSource.base.interaction.call(this);

  this.content.children('button').click(this.loadDataDialog.bind(this));
};

/**
 * Deletes a dataset from the data list.
 * @param {number} dataIndex
 */
visflow.DataSource.prototype.deleteData = function(dataIndex) {
  this.data.splice(dataIndex, 1);
  this.rawData.splice(dataIndex, 1);
  this.pushflow();
};

/**
 * Shows the data list in the node.
 * @private
 */
visflow.DataSource.prototype.showNodeDataList_ = function() {
  var dataName = this.content.find('#data-name');
  var text = this.data.length == 0 ? 'No Data' :
    this.data.map(function(data) {
      return data.name;
    }).join(', ');
  if (text.length > visflow.DataSource.DATA_NAMES_LENGTH) {
    text = text.substr(0, visflow.DataSource.DATA_NAMES_LENGTH - 3) + '...';
  }
  dataName.text(text).show();
  this.content.find('#data-error').hide();
};

/**
 * Shows the data list both in panel and in node.
 */
visflow.DataSource.prototype.showDataList = function() {
  visflow.data.listData(function(dataList) {
    var dataInfos = {};
    dataList.forEach(function(dataInfo) {
      dataInfos[dataInfo.id] = dataInfo;
    });
    this.data.forEach(function(dataInfo) {
      if (dataInfo.id in dataInfos) {
        var info = dataInfos[dataInfo.id];
        dataInfo.name = info.name;
        dataInfo.file = info.file;
      } else {
        visflow.error('data used not listed:', dataInfo.id, dataInfo.name,
          dataInfo.file);
      }
    });
    if (visflow.optionPanel.isOpen) {
      this.createPanelDataList(visflow.optionPanel.contentContainer());
    }
    // Show data list in node.
    this.showNodeDataList_();
  }.bind(this));
};

/**
 * Updates the data transpose option.
 * @private
 */
visflow.DataSource.prototype.updateTranspose_ = function() {
  if (visflow.optionPanel.isOpen) {
    var panelContainer = visflow.optionPanel.contentContainer();
    panelContainer.find('#transpose-section').toggle(this.options.transpose);
  }
  this.pushflow();
};

/**
 * Checks if there are duplicate attribute in transpose keys.
 * @private
 */
visflow.DataSource.prototype.validateTransposeAttributes_ = function() {
  var keys = _.keySet(this.options.transposeKeys);
  var duplicate = false;
  this.options.transposeAttrs.forEach(function(dim) {
    if (dim in keys) {
      duplicate = true;
    }
  });
  if (duplicate) {
    visflow.warning('transpose attribute duplicate in keys');
  }
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
  server.removeClass('disabled');
  btnServer.hide();
  online.addClass('disabled');
  btnOnline.show();
};

/**
 * Creates the load data dialog.
 */
visflow.DataSource.prototype.loadDataDialog = function() {
  visflow.dialog.create({
    template: visflow.DataSource.SELECT_DATA_TEMPLATE,
    complete: function(dialog) {
      dialog.find('.to-tooltip').tooltip({
        delay: this.TOOLTIP_DELAY
      });

      var dataId = '';
      var dataName = '';
      var dataFile = '';
      var confirm = dialog.find('#confirm');

      // Checks whether upload options have been all set.
      var uploadable = function() {
        var allSet = dataId !== '' && dataName !== '';
        confirm.prop('disabled', !allSet);
      }.bind(this);

      confirm.click(function() {
        this.data.push({
          id: dataId,
          name: dataName,
          file: dataFile
        });
        this.loadData({
          index: this.data.length - 1,
          callback: this.pushflow.bind(this)
        });
      }.bind(this));

      visflow.data.listData(function(dataList) {
        var table = dialog.find('table');
        if (this.table_) {
          this.table_.destroy();
        }
        this.table_ = visflow.upload.listDataTable(table, dataList);
        table
          .on('select.dt', function(event, dt, type, tableIndices) {
            var data = /** @type {DataTables} */(dt)
              .row(tableIndices[0]).data();
            dataId = data.id;
            dataName = data.name;
            dataFile = data.file;
            uploadable();
          })
          .on('deselect.dt', function() {
            dataId = '';
            dataName = '';
            dataFile = '';
            uploadable();
          });
      }.bind(this));

      dialog.find('.online #data-name').keyup(function(event) {
        dataName = $(event.target).val();
        uploadable();
      }.bind(this));
      dialog.find('.online #url').keyup(function(event) {
        dataFile = $(event.target).val();
        uploadable();
      }.bind(this));

      this.updateActiveSections_(dialog);

      dialog.find('#btn-upload').click(function(event) {
        event.stopPropagation();
        visflow.upload.setComplete(this.loadDataDialog.bind(this));
        visflow.upload.upload();
      }.bind(this));
    }.bind(this)
  });
};

/**
 * Clears the currently loaded data.
 */
visflow.DataSource.prototype.clearData = function() {
  this.data = [];
  this.rawData = [];
  this.showDataList();
  this.pushflow();
};

/**
 * Loads the data specified into the data array.
 * This iterates the data list and sees if some data is not yet loaded. You can
 * call this method even when some data are already loaded.
 * @param {{
 *   index: (number|undefined),
 *   callback: (Function|undefined)
 * }=} opt_options
 *   index: If specified, then force data at this index to be reloaded.
 *   callback: Callback when all data are completely loaded.
 */
visflow.DataSource.prototype.loadData = function(opt_options) {
  var options = opt_options || {};

  // Force options.index to be reloaded.
  if (options.index != undefined) {
    this.rawData[options.index] = null;
  }

  var counter = 0;
  // Check if all data has been loaded, if so we process and propagate.
  var complete = function() {
    if (counter == 0 && options.callback) {
      options.callback();
    }
  }.bind(this);
  var hasAsyncLoad = false;
  this.data.forEach(function(data, dataIndex) {
    if (this.rawData[dataIndex]) {
      // Skip already loaded data.
      return;
    }
    counter++;
    var url = visflow.url.GET_DATA + '?id=' + data.id;

    // Check if the dataset has already been loaded so that we can re-use the
    // existing dataset.
    var duplicateData = visflow.data.duplicateData(data);
    if (duplicateData != null) {
      this.rawData[dataIndex] = duplicateData;
      --counter;
      return;
    }

    hasAsyncLoad = true;

    $.get(url)
      .done(function(result) {
        visflow.assert(result != null);
        // CSV parser will report error itself.
        result = visflow.parser.csv(result);

        // Store a copy of parsed data, so that we can switch between transpose
        // and non-transpose.
        this.rawData[dataIndex] = result;

        visflow.data.registerRawData(data, result);

        --counter;
        complete();
      }.bind(this))
      .fail(function(res) {
        visflow.error('cannot get data:', res.responseText);

        --counter;
        complete();
      }.bind(this));
  }, this);

  if (!hasAsyncLoad && options.callback) {
    options.callback();
  }
};

/**
 * Sets empty data to be propagated.
 * @param {boolean=} opt_isError
 * @private
 */
visflow.DataSource.prototype.useEmptyData_ = function(opt_isError) {
  if (opt_isError) {
    this.content.find('#data-name').hide();
    this.content.find('#data-error').show();
  }
  // No data. Create empty package and propagate.
  $.extend(this.getDataOutPort().pack, new visflow.Subset());
};

/**
 * Automatically finds a string dimension for transpose key.
 * @return {!Array<number>} Dimension index.
 */
visflow.DataSource.prototype.findTransposeDims = function() {
  if (this.data.length == 0) {
    return [];
  }
  var data = _.first(this.rawData);
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] == visflow.ValueType.STRING &&
        !data.dimensionDuplicate[dim]) {
      return [dim];
    }
  }
  return [visflow.data.INDEX_DIM];
};

/**
 * Automatically finds numerical attributes for transpose attibutes.
 * @return {!Array<number>} Dimension index.
 */
visflow.DataSource.prototype.findTransposeAttrs = function() {
  if (this.data.length == 0) {
    return [];
  }
  var data = _.first(this.rawData);
  var dims = [];
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] != visflow.ValueType.STRING) {
      if (dims.length < visflow.DataSource.DEFAULT_NUM_ATTRS) {
        dims.push(dim);
      }
    }
  }
  return dims;
};

/**
 * Checks if all data have been loaded.
 * @return {boolean}
 * @private
 */
visflow.DataSource.prototype.allDataLoaded_ = function() {
  var allLoaded = true;
  this.data.forEach(function(data, dataIndex) {
    if (!this.rawData[dataIndex]) {
      allLoaded = false;
    }
  }, this);
  return allLoaded;
};

/**
 * Actually processes the data. This is run after making sure that all data
 * have been loaded.
 * @param {Function} endProcess
 * @private
 */
visflow.DataSource.prototype.processData_ = function(endProcess) {
  // Check if all data are compatible.
  var values = [];
  var mismatched = {};
  var type;
  var firstDataIndex = -1;
  this.rawData.forEach(function(data, dataIndex) {
    if (firstDataIndex == -1) {
      firstDataIndex = dataIndex;
      type = data.type;
    } else if (data.type != type) { // Data type mismatch.
      visflow.error('data type mismatch');
      mismatched[dataIndex] = true;
      return;
    }
    values = values.concat(data.values);
  });

  if (firstDataIndex == -1) {
    this.useEmptyData_();
    this.showDataList();

    endProcess();
    return;
  }

  for (var dataIndex in mismatched) {
    this.data.splice(dataIndex, 1);
    this.rawData.splice(dataIndex, 1);
  }
  var finalData = /** @type {visflow.TabularData} */(
    $.extend({}, this.rawData[firstDataIndex]));
  finalData.values = values;

  this.showDataList();

  // Apply transpose.
  if (this.options.transpose) {
    if (this.options.transposeKeys.length == 0) {
      this.options.transposeKeys = this.findTransposeDims();
      this.options.transposeAttrs = this.findTransposeAttrs();
    }
    var result = visflow.parser.transpose(
      finalData,
      this.options.transposeKeys,
      this.options.transposeAttrs,
      this.options.transposeName
    );
    if (!result.success) {
      visflow.error('failed to transpose data:', result.msg);
      this.useEmptyData_(true);

      endProcess();
      return;
    }
    finalData = /** @type {visflow.TabularData} */(result.data);
  }

  var lengthSuffix = this.data.length > 3 ? '...' : '';
  var firstThreeData = this.data.slice(0, 3);
  var finalName = firstThreeData.map(function(data) {
    return data.name;
  }).join(',') + lengthSuffix;
  var finalFile = firstThreeData.map(function(data) {
    return data.file;
  }).join(',') + lengthSuffix;

  _.extend(finalData, {
    name: finalName,
    file: finalFile
  });

  var data = new visflow.Dataset(/** @type {visflow.TabularData} */(finalData));
  /*
  if (data.type !== '') {
    visflow.data.registerData(data);
  }
  */
  // Overwrite data object (to keep the same reference).
  $.extend(this.getDataOutPort().pack, new visflow.Subset(data));

  endProcess();
};

/** @inheritDoc */
visflow.DataSource.prototype.processAsync = function(endProcess) {
  if (!this.allDataLoaded_()) {
    console.warn('load data async');
    this.loadData({
      callback: this.processData_.bind(this, endProcess)
    });
  } else {
    this.processData_(endProcess);
  }
};

/**
 * Since data source does not have input, return the output data.
 * @inheritDoc
 */
visflow.DataSource.prototype.getInputData = function() {
  return [this.getDataOutPort().pack.data];
};

/** @inheritDoc */
visflow.DataSource.prototype.getDimensionNames = function() {
  return this.getDataOutPort().pack.data.dimensions;
};


/**
 * Sets the dataset and loads the data.
 * @param {visflow.data.Info} dataInfo
 */
visflow.DataSource.prototype.setData = function(dataInfo) {
  this.data = [dataInfo];
  this.loadData({
    index: 0,
    callback: this.pushflow.bind(this)
  });
};
