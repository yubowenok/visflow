/**
 * @fileoverview VisFlow file upload.
 */

'use strict';

/** @const */
visflow.upload = {};

/** @private @const {string} */
visflow.upload.TEMPLATE_ = './src/upload/upload-dialog.html';

/** @private {?function} */
visflow.upload.complete_ = null;

/**
 * CSV to be exported.
 * @private {visflow.Package}
 */
visflow.upload.exportPackage_;

/**
 * Creates an upload dialog that allows the user to select local file for
 * upload.
 */
visflow.upload.dialog = function() {
  visflow.dialog.create({
    template: visflow.upload.TEMPLATE_,
    complete: visflow.upload.initDialog_
  });
};

/**
 * Creates an upload dialog for the exported data.
 * @param {!visflow.Package}
 */
visflow.upload.export = function(pack) {
  visflow.upload.exportPackage_ = pack;
  visflow.dialog.create({
    template: visflow.upload.TEMPLATE_,
    complete: visflow.upload.initExportDialog_
  });
};

/**
 * Adds a data upload complete callback which will be fired once after a
 * successful data load.
 * @param {function} complete
 */
visflow.upload.setComplete = function(complete) {
  visflow.upload.complete_ = complete;
};

/**
 * Initializes the data upload dialog.
 * @param {!jQuery} dialog
 * @private
 */
visflow.upload.initDialog_ = function(dialog) {
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

  btnUpload.click(function(event) {
    if (visflow.upload.complete_ != null) {
      // complete_ callback may show another modal immediately.
      event.stopPropagation();
    }

    var formData = new FormData();
    var name = dataName.val();
    formData.append('name', name);
    formData.append('file', selectedFile);

    $.ajax({
      url: './server/upload.php',
      type: 'POST',
      data: formData,
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false
    }).done(function(res) {
        if (!res.success) {
          visflow.error('failed to upload data:', res.msg);
          return;
        }
        visflow.success('data uploaded:', name,
          '(' + selectedFile.name + ')');
        if (visflow.upload.complete_ != null) {
          visflow.upload.complete_();
        }
        visflow.upload.complete_ = null;
      })
      .fail(function(res, msg, error) {
        visflow.error('failed to upload data', msg, error);
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
    $.post('./server/export.php', {
      name: name,
      file: pack.data.file + '_' + CryptoJS.SHA1(name).toString().substr(0, 8),
      data: csv
    }).done(function(res) {
        if (!res.success) {
          visflow.error('failed to upload data:', res.msg);
          return;
        }
        visflow.success('data uploaded:', name);
      })
      .fail(function(res, msg, error) {
        visflow.error('failed to export data', msg, error);
      });
  });
};
