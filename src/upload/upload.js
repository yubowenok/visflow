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
 * CSV to be exported.
 * @private {?visflow.Package}
 */
visflow.upload.exportPackage_ = null;



/**
 * Creates an upload dialog that allows the user to select local file for
 * upload.
 */
visflow.upload.dialog = function() {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to upload data');
    visflow.dialog.close();
    return;
  }
  $.get(visflow.url.LIST_DATA)
    .done(function(dataList) {
      visflow.dialog.create({
        template: visflow.upload.TEMPLATE_,
        complete: visflow.upload.uploadDialog_,
        params: dataList
      });
    })
    .fail(function(res) {
      visflow.error('cannot list server data:', res.responseText);
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
    complete: visflow.upload.initDeleteConfirmation_,
    params: params
  });
};

/**
 * Creates an upload dialog for the exported data.
 * @param {!visflow.Package} pack
 */
visflow.upload.export = function(pack) {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to export data');
    return;
  }
  visflow.upload.exportPackage_ = pack;
  visflow.dialog.create({
    template: visflow.upload.TEMPLATE_,
    complete: visflow.upload.initExportDialog_
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
 * @param {FormData} formData
 * @private
 */
visflow.upload.upload_ = function(formData) {
  $.ajax({
    url: visflow.url.UPLOAD_DATA,
    type: 'POST',
    data: formData,
    enctype: 'multipart/form-data',
    processData: false,
    contentType: false
  }).done(function() {
      visflow.success('data uploaded:', formData.get('name'),
        '(' + formData.get('fileName') + ')');
      if (visflow.upload.complete_ != null) {
        visflow.upload.complete_();
      }
      visflow.upload.complete_ = null;
      visflow.signal(visflow.upload, 'uploaded');
    })
    .fail(function(res) {
      visflow.error('failed to upload data:', res.responseText);
      visflow.upload.complete_ = null;
    });
};

/**
 * Initializes the data upload dialog.
 * @param {!jQuery} dialog
 * @param {!Array<visflow.data.ListInfo>} dataList
 * @private
 */
visflow.upload.uploadDialog_ = function(dialog, dataList) {
  var file = dialog.find('#file');
  var nameInput = dialog.find('#data-name');
  var fileDisplay = dialog.find('#file-display');
  var confirm = dialog.find('#confirm').prop('disabled', true);
  var btnFile = dialog.find('#btn-file');
  var shareWith = dialog.find('#share-with');

  var selectedFile = null;
  var dataId = -1;
  var prevDataName = '';
  var prevDataFile = '';
  var dataName = '';
  var dataFile = '';

  var dataIds = _.keySet(dataList.map(function(dataInfo) {
    return dataInfo.id;
  }));

  // Checks if all required fields are filled.
  var uploadReady = function() {
    return dataName !== '' && (dataId != -1 || selectedFile);
  };

  var dt = visflow.upload.listDataTable(dialog.find('table'), dataList);
  dt.on('select.dt', function(event, dt, type, tableIndices) {
    var dataInfo = /** @type {DataTables} */(dt).row(tableIndices[0]).data();
    dataId = dataInfo.id;
    prevDataName = dataName = dataInfo.name;
    prevDataFile = dataFile = dataInfo.file;

    shareWith.val(dataInfo.shareWith);
    shareWith.prop('disabled', dataInfo.owner !== '');

    nameInput.val(dataName);
    confirm.prop('disabled', !uploadReady());
  }).on('deselect.dt', function() {
    dataId = -1;
    confirm.prop('disabled', !uploadReady());
  });

  btnFile.click(function() {
    file.trigger('click');
  });
  fileDisplay.click(function() {
    file.trigger('click');
  });

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
    confirm.prop('disabled', !uploadReady());
  });
  nameInput.keyup(function() {
    dataName = nameInput.val();
    confirm.prop('disabled', !uploadReady());
  });

  confirm.click(function(event) {
    if (visflow.upload.complete_ != null) {
      // complete_ callback may show another modal immediately.
      event.stopPropagation();
    }

    var formData = new FormData();
    formData.append('id', dataId);
    formData.append('name', dataName);
    formData.append('fileName', dataFile);
    formData.append('shareWith', /** @type {string} */(shareWith.val()));
    formData.append('file', selectedFile);

    if (dataId in dataIds) {
      // another dialog will popup immediately
      event.stopPropagation();

      formData.append('prevDataName', prevDataName);
      formData.append('prevDataFile', prevDataFile);
      // update previous data
      visflow.upload.overwriteDialog_(formData);
    } else {
      // upload new data
      visflow.upload.upload_(formData);
    }
  });
};

/**
 * Asks for confirmation about overwriting an existing dataset.
 * @param {FormData} formData
 * @private
 */
visflow.upload.overwriteDialog_ = function(formData) {
  visflow.dialog.create({
    template: visflow.upload.OVERWRITE_DIALOG_,
    complete: function(dialog) {
      dialog.find('label.new').text(formData.get('name') + ' (' +
        formData.get('fileName') + ')');
      dialog.find('label.old').text(formData.get('prevDataName') + ' (' +
        formData.get('prevDataFile') + ')');
      dialog.find('#confirm').click(function() {
        visflow.upload.upload_(formData);
      });
    }
  });
};

/**
 * Initializes the data export dialog that has special features over the normal
 * upload dialog.
 * @param {!jQuery} dialog
 * @private
 */
visflow.upload.initExportDialog_ = function(dialog) {
  var confirm = dialog.find('#confirm');
  var pack = visflow.upload.exportPackage_;

  dialog.find('#btn-file').prop('disabled', true);
  dialog.find('#file-display').addClass('disabled')
    .text('(exported from ' + pack.data.file + ')');

  var dataName = dialog.find('#data-name')
    .val(pack.data.name + ' (' + visflow.utils.randomString(4) + ')');
  var csv = visflow.parser.tabularToCSV(pack.data, pack.items);

  dataName.keyup(function() {
    // Checks if all required fields are filled.
    confirm.prop('disabled', !dataName.val());
  });

  confirm.click(function() {
    var name = dataName.val();
    $.post(visflow.url.EXPORT_DATA, {
      name: name,
      file: pack.data.file + '_' + CryptoJS.SHA256(name)
        .toString().substr(0, 8),
      data: csv
    }).done(function() {
        visflow.success('data uploaded:', name);
      })
      .fail(function(res) {
        visflow.error('failed to export data:', res.responseText);
      });
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
visflow.upload.initDeleteConfirmation_ = function(dialog, params) {
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
      {title: 'Name', data: 'name'},
      {title: 'File', data: 'file'},
      {title: 'Size', data: 'size'},
      {title: 'Last Modified', data: 'mtime'},
      {title: 'Owner', data: 'owner'},
      {title: '', data: 'id'}
    ],
    columnDefs: [
      {
        type: 'data-size',
        // Size
        render: function(size) {
          var base = 1000;
          if (size < base) {
            return size + 'B';
          } else if (size < base * base) {
            return (size / base).toFixed(2) + 'KB';
          } else {
            return (size / base / base).toFixed(2) + 'MB';
          }
        },
        targets: 2
      },
      {
        // Last Modified
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
