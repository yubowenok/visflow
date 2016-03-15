/**
 * @fileoverview VisFlow file upload.
 */

/** @const */
visflow.upload = {};

/** @private @const {string} */
visflow.upload.TEMPLATE_ = './dist/html/upload/upload-data.html';
/** @private @const {string} */
visflow.upload.DELETE_CONFIRMATION_ = './dist/html/upload/delete-data.html';

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
  visflow.dialog.create({
    template: visflow.upload.TEMPLATE_,
    complete: visflow.upload.initUploadDialog_
  });
};

/**
 * Creates a delete data confirmation dialog.
 * @param {{
 *   fileName: string,
 *   dataName: string
 * }} params
 */
visflow.upload.delete = function(params) {
  if (!visflow.user.writePermission()) {
    visflow.warning('you must login to delete data');
    visflow.dialog.close();
    return;
  }
  visflow.dialog.create({
    template: visflow.upload.DELETE_CONFIRMATION_,
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
 * Initializes the data upload dialog.
 * @param {!jQuery} dialog
 * @private
 */
visflow.upload.initUploadDialog_ = function(dialog) {
  var selectedFile = null;

  var file = dialog.find('#file');
  var dataName = dialog.find('#data-name');
  var btnUpload = dialog.find('#confirm').prop('disabled', true);
  var btnFile = dialog.find('#btn-file');
  var fileDisplay = dialog.find('#file-display');

  btnFile.click(function() {
    file.trigger('click');
  });
  fileDisplay.click(function() {
    file.trigger('click');
  });

  // Checks if all required fields are filled.
  var uploadReady = function() {
    var name = dataName.val();
    return name && selectedFile;
  };

  file.change(function(event) {
    if (event.target.files[0] != null) {
      selectedFile = event.target.files[0];
      fileDisplay.text(selectedFile.name);
      if (dataName.val() === '') {
        dataName.val(selectedFile.name);
      }
    }
    btnUpload.prop('disabled', !uploadReady());
  });
  dataName.keyup(function() {
    btnUpload.prop('disabled', !uploadReady());
  });

  // Shows uploaded data list.
  $.get(visflow.url.LIST_DATA)
    .done(function(res) {
      var table = dialog.find('table');
      visflow.upload.listDataTable(table, res.filelist);
    })
    .fail(function(res) {
      visflow.error('cannot list server data:', res.responseText);
    });

  btnUpload.click(function(event) {
    if (visflow.upload.complete_ != null) {
      // complete_ callback may show another modal immediately.
      event.stopPropagation();
    }

    var formData = new FormData();
    var name = /** @type {string} */(dataName.val());
    formData.append('name', name);
    formData.append('file', selectedFile);

    $.ajax({
      url: visflow.url.UPLOAD,
      type: 'POST',
      data: formData,
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false
    }).done(function() {
        visflow.success('data uploaded:', name,
          '(' + selectedFile.name + ')');
        if (visflow.upload.complete_ != null) {
          visflow.upload.complete_();
        }
        visflow.upload.complete_ = null;
      })
      .fail(function(res) {
        visflow.error('failed to upload data:', res.responseText);
        visflow.upload.complete_ = null;
      });
  });
};

/**
 * Initializes the data export dialog that has special features over the normal
 * upload dialog.
 * @param {!jQuery} dialog
 * @private
 */
visflow.upload.initExportDialog_ = function(dialog) {
  var btnUpload = dialog.find('#confirm');
  var pack = visflow.upload.exportPackage_;

  dialog.find('#btn-file').prop('disabled', true);
  dialog.find('#file-display').addClass('disabled')
    .text('(exported from ' + pack.data.file + ')');

  var dataName = dialog.find('#data-name')
    .val(pack.data.name + ' (' + visflow.utils.randomString(4) + ')');
  var csv = visflow.parser.tabularToCSV(pack.data, pack.items);

  dataName.keyup(function() {
    // Checks if all required fields are filled.
    btnUpload.prop('disabled', !dataName.val());
  });

  btnUpload.click(function() {
    var name = dataName.val();
    $.post(visflow.url.EXPORT, {
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
 *   fileName: string,
 *   dataName: string
 * }} params
 * @private
 */
visflow.upload.initDeleteConfirmation_ = function(dialog, params) {
  dialog.find('.data-name').text(params.dataName);
  dialog.find('.file-name').text(params.fileName);
  dialog.find('#confirm').click(function() {
    $.post(visflow.url.DELETE_DATA, {
      fileName: params.fileName
    }).done(function() {
        visflow.success('data deleted:', params.fileName);
      })
      .fail(function(res) {
        visflow.error('failed to delete data:', res.responseText);
      });
  });
};

/**
 * Shows a table with list of data sets stored on the server.
 * @param {!jQuery} table
 * @param {!Array<{filename: string, mtime: number}>} fileList
 * @return {DataTables}
 */
visflow.upload.listDataTable = function(table, fileList) {
  return table.DataTable({
    data: fileList,
    select: 'single',
    pagingType: 'full',
    pageLength: 5,
    lengthMenu: [5, 10, 20],
    order: [
      [3, 'desc']
    ],
    columns: [
      {title: 'Data Name', data: 'dataname'},
      {title: 'File Name', data: 'filename'},
      {title: 'Size', data: 'size'},
      {title: 'Last Modified', data: 'mtime'},
      {title: '', data: 'dataname'}
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
        render: function() {
          return '<span class="btn btn-default btn-xs glyphicon ' +
            'glyphicon-trash' + (
              visflow.user.writePermission() ? '' : 'disabled'
            ) + '"></span>';
        },
        targets: 4
      }
    ],
    drawCallback: function() {
      // The event handler still exists on the same element, when it is redrawn
      // by search (the element persists). Therefore we need to off the handler.
      table.find('tr .glyphicon-trash')
        .off('click')
        .click(function(event) {
          var tr = $(event.target).closest('tr');
          var dataName = tr.children('td:nth-child(1)').text();
          var fileName = tr.children('td:nth-child(2)').text();
          visflow.upload.delete({
            fileName: /** @type {string} */(fileName),
            dataName: /** @type {string} */(dataName)
          });
          event.stopPropagation();
        });
    }
  });
};
