/**
 * @fileoverview VisFlow file upload.
 */

/** @const */
visflow.upload = {};

/** @private @const {string} */
visflow.upload.TEMPLATE_ = './dist/html/upload/upload-data.html';
/** @private @const {string} */
visflow.upload.DELETE_DIALOG_ = './dist/html/upload/delete-data.html';
/** @private @const {string} */
visflow.upload.OVERWRITE_DIALOG_ =
  './dist/html/upload/overwrite-data.html';

/** @private {?Function} */
visflow.upload.complete_ = null;

/**
 * Creates an upload dialog that allows the user to select local file for
 * upload.
 */
visflow.upload.upload = function() {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to upload data');
    visflow.dialog.close();
    return;
  }
  visflow.data.listData(function(dataList) {
    visflow.dialog.create({
      template: visflow.upload.TEMPLATE_,
      complete: visflow.upload.uploadDialog_,
      params: {
        dataList: dataList
      }
    });
  });
};

/**
 * Creates an upload dialog for the exported data.
 * @param {!visflow.Subset} pack
 */
visflow.upload.export = function(pack) {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to export data');
    return;
  }
  visflow.data.listData(function(dataList) {
    visflow.dialog.create({
      template: visflow.upload.TEMPLATE_,
      complete: visflow.upload.exportDialog_,
      params: {
        dataList: dataList,
        pack: pack
      }
    });
  });
};

/**
 * Creates a delete data confirmation dialog.
 * @param {{
 *   id: number,
 *   name: string,
 *   file: string
 * }} params
 */
visflow.upload.delete = function(params) {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to delete data');
    visflow.dialog.close();
    return;
  }
  visflow.dialog.create({
    template: visflow.upload.DELETE_DIALOG_,
    complete: visflow.upload.deleteDialog_,
    params: params
  });
};

/**
 * Adds a data upload complete callback which will be fired once after a
 * successful data load.
 * @param {Function} complete
 */
visflow.upload.setComplete = function(complete) {
  visflow.upload.complete_ = complete;
};

/**
 * Uploads/updates a dataset.
 * @param {{
 *   id: number,
 *   name: string,
 *   fileName: string,
 *   shareWith: string,
 *   file: (undefined|Blob),
 *   data: (undefined|string)
 * }} formParams
 * @private
 */
visflow.upload.upload_ = function(formParams) {
  $.ajax({
    url: visflow.url.UPLOAD_DATA,
    type: 'POST',
    data: visflow.utils.formData(formParams),
    enctype: 'multipart/form-data',
    processData: false,
    contentType: false
  }).done(function() {
      visflow.success('data updated:', formParams.name,
        '(' + formParams.fileName + ')');
      if (visflow.upload.complete_ != null) {
        visflow.upload.complete_();
      }
      visflow.upload.complete_ = null;
      visflow.signal(visflow.upload, visflow.Event.UPLOADED);
    })
    .fail(function(res) {
      visflow.error('failed to update data:', res.responseText);
      visflow.upload.complete_ = null;
    });
};

/**
 * Initializes the data upload dialog.
 * @param {!jQuery} dialog
 * @param {{
 *   dataList: !Array<visflow.data.ListInfo>,
 *   data: (string|undefined),
 *   defaultDataName: (string|undefined),
 *   defaultFileName: (string|undefined)
 * }} params
 * @private
 */
visflow.upload.uploadDialog_ = function(dialog, params) {
  var dataList = params.dataList;
  /** @type {!Object<number, visflow.data.ListInfo>} */
  var dataIdInfos = {};
  /** @type {!Object<visflow.data.ListInfo>} */
  var fileNameInfos = {}; // contain only owned data
  dataList.forEach(function(dataInfo) {
    dataIdInfos[dataInfo.id] = dataInfo;
    if (dataInfo.owner === '') {
      fileNameInfos[dataInfo.file] = dataInfo;
    }
  });

  /** @type {?Blob} */
  var selectedFile = null;
  /** @type {number} */
  var dataId = -1;
  /** @type {string} */
  var dataName = params.defaultDataName !== undefined ?
    params.defaultDataName : '';
  var dataFile = '';
  var prevDataName = '';
  var prevDataFile = '';
  var isOwner = true;

  // Checks if all required fields are filled.
  var uploadReady = function() {
    confirm.prop('disabled', dataName === '' ||
      (isOwner && !selectedFile && (dataId == -1 ||
      dataIdInfos[dataId].shareWith == shareWith.val())) ||
      (!isOwner && !selectedFile));
  };

  var file = dialog.find('#file');
  var nameInput = dialog.find('#data-name')
    .val(dataName)
    .keyup(function() {
      dataName = /** @type {string} */(nameInput.val());
      uploadReady();
    });
  var fileDisplay = dialog.find('#file-display')
    .click(function() {
      file.trigger('click');
    });
  dialog.find('#btn-file')
    .click(function() {
      file.trigger('click');
    });
  var shareWith = dialog.find('#share-with')
    .keyup(function() {
      uploadReady();
    });
  var confirm = dialog.find('#confirm')
    .prop('disabled', params.data === undefined);

  file.change(function(event) {
    if (event.target.files[0] != null) {
      selectedFile = event.target.files[0];
      dataFile = selectedFile.name;

      fileDisplay.text(selectedFile.name);
      if (dataName === '') {
        dataName = selectedFile.name;
        nameInput.val(dataName);
      }
    }
    uploadReady();
  });

  confirm.click(function(event) {
    if (visflow.upload.complete_ != null) {
      // complete_ callback may show another modal immediately.
      event.stopPropagation();
    }

    var fileName = params.defaultFileName !== undefined ?
      params.defaultFileName : dataFile;
    if (!isOwner) {
      fileName = dataIdInfos[dataId].file;
    }

    var formParams = {
      id: dataId,
      name: dataName,
      fileName: fileName,
      shareWith: /** @type {string} */(shareWith.val())
    };
    if (params.data) {
      formParams.data = params.data;
    } else {
      formParams.file = selectedFile;
    }

    if (!isOwner || (isOwner && fileName in fileNameInfos)) {
      // another dialog prompts immediately
      event.stopPropagation();

      if (isOwner && dataName in fileNameInfos && dataId == -1) {
        var info = fileNameInfos[dataName];
        prevDataName = info.name;
        prevDataFile = info.file;
        formParams.id = info.id;
      }

      // update previous data
      visflow.upload.overwriteDialog_({
        prevDataName: prevDataName,
        prevDataFile: prevDataFile,
        formParams: formParams
      });
    } else {
      // upload new data
      visflow.upload.upload_(formParams);
    }
  });

  var dt = visflow.upload.listDataTable(dialog.find('table'), dataList);
  dt.on('select.dt', function(event, dt, type, tableIndices) {
    var dataInfo = /** @type {DataTables} */(dt).row(tableIndices[0]).data();
    dataId = dataInfo.id;
    prevDataName = dataName = dataInfo.name;
    prevDataFile = dataFile = dataInfo.file;
    isOwner = dataInfo.owner === '';
    nameInput
      .val(dataName)
      .prop('disabled', !isOwner);
    shareWith
      .val(dataInfo.shareWith)
      .prop('disabled', !isOwner);
    uploadReady();
  }).on('deselect.dt', function() {
    dataId = -1;
    isOwner = true;
    nameInput.prop('disabled', !isOwner);
    shareWith.prop('disabled', !isOwner).val('');
    uploadReady();
  });
};

/**
 * Sets up the export dialog that has special features over the normal
 * upload dialog.
 * @param {!jQuery} dialog
 * @param {{
 *   dataList: !Array<visflow.data.ListInfo>,
 *   pack: !visflow.Subset
 * }} params
 * @private
 */
visflow.upload.exportDialog_ = function(dialog, params) {
  var confirm = dialog.find('#confirm');
  var pack = params.pack;

  dialog.find('#btn-file').prop('disabled', true);
  dialog.find('#file-display').addClass('disabled')
    .text('(exported from ' + pack.data.file + ')');

  var defaultDataName = pack.data.name + ' (' + visflow.utils.randomString(4) +
    ')';
  var csv = visflow.parser.tabularToCSV(pack.data, pack.items);
  _.extend(params, {
    defaultDataName: defaultDataName,
    defaultFileName: pack.data.file + '_' + CryptoJS.SHA256(defaultDataName)
      .toString().substr(0, 8),
    data: csv
  });
  visflow.upload.uploadDialog_(dialog, params);
};

/**
 * Asks for confirmation about overwriting an existing dataset.
 * @param {{
 *   prevDataName: string,
 *   prevDataFile: string,
 *   formParams: {
 *     id: number,
 *     name: string,
 *     fileName: string,
 *     shareWith: string,
 *     file: (undefined|Blob),
 *     data: (undefined|string)
 *   }
 * }} params
 * @private
 */
visflow.upload.overwriteDialog_ = function(params) {
  var formParams = params.formParams;
  visflow.dialog.create({
    template: visflow.upload.OVERWRITE_DIALOG_,
    complete: function(dialog) {
      //dialog.find('label.new').text(formParams.name + ' (' +
      //  formParams.fileName + ')');
      dialog.find('label.old').text(params.prevDataName + ' (' +
        params.prevDataFile + ')');
      dialog.find('#confirm').click(function() {
        visflow.upload.upload_(formParams);
      });
    }
  });
};

/**
 * Sets up the data delete confirmation.
 * @param {!jQuery} dialog
 * @param {{
 *   id: number,
 *   name: string,
 *   file: string
 * }} params
 * @private
 */
visflow.upload.deleteDialog_ = function(dialog, params) {
  dialog.find('.data-name').text(params.name);
  dialog.find('.file-name').text(params.file);
  dialog.find('#confirm').click(function() {
    $.post(visflow.url.DELETE_DATA, {
      id: params.id
    }).done(function() {
        visflow.success('data deleted:', params.name);
      })
      .fail(function(res) {
        visflow.error('failed to delete data:', res.responseText);
      });
  });
};

/**
 * Shows a table with list of data sets stored on the server.
 * @param {!jQuery} table
 * @param {!Array<visflow.data.ListInfo>} dataList
 * @return {DataTables}
 */
visflow.upload.listDataTable = function(table, dataList) {
  var dataInfo = {};
  dataList.forEach(function(info) {
    dataInfo[info.id] = info;
  });
  return table.DataTable({
    data: dataList,
    select: 'single',
    pagingType: 'full',
    pageLength: 5,
    lengthMenu: [5, 10, 20],
    order: [
      [3, 'desc']
    ],
    columns: [
      {title: 'Name', data: 'name', className: 'col-name'},
      {title: 'File', data: 'file', className: 'col-file'},
      {title: 'Size', data: 'size'},
      {title: 'Last Modified', data: 'mtime', className: 'col-date'},
      {title: 'Owner', data: 'owner', className: 'col-owner'},
      {title: '', data: 'id'}
    ],
    columnDefs: [
      {
        type: 'data-size',
        render: function(size) {
          return visflow.utils.fileSizeDisplay(size);
        },
        targets: 2
      },
      {
        type: 'date', // Last Modified
        render: function(lastModified) {
          return (new Date(lastModified)).toLocaleString();
        },
        targets: 3
      },
      {
        render: function(dataId) {
          return [
            '<span class="btn btn-default btn-xs glyphicon glyphicon-trash ',
            !visflow.user.writePermission() ||
            dataInfo[dataId].owner !== '' ? 'disabled' : '',
            '" ',
            'data-id="',
            dataId,
            '">',
            '</span>'
          ].join('');
        },
        targets: 5
      }
    ],
    drawCallback: function() {
      // The event handler still exists on the same element, when it is redrawn
      // by search (the element persists). Therefore we need to off the handler.
      table.find('tr .glyphicon-trash')
        .off('click')
        .click(function(event) {
          var dataId = +$(event.target).attr('data-id');
          visflow.upload.delete({
            id: dataId,
            name: dataInfo[dataId].name,
            file: dataInfo[dataId].file
          });
          event.stopPropagation();
        });
    }
  });
};
