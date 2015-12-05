/**
 * @fileoverview VisFlow file upload.
 */

'use strict';

/** @const */
visflow.upload = {};

/** @private @const {string} */
visflow.upload.TEMPLATE_ = './src/upload/upload-dialog.html';

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
    }
    btnUpload.prop('disabled', !uploadReady());
  });
  dataName.keyup(function() {
    btnUpload.prop('disabled', !uploadReady());
  });

  btnUpload.click(function() {
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
      } else {
        visflow.success('data uploaded:', name,
          '(' + selectedFile.name + ')');
      }
    })
      .fail(function() {
        visflow.error('failed to upload data');
      });
  });
};
