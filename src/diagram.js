/**
 * @fileoverview Diagram related functions.
 */

/** @const */
visflow.diagram = {};

/** @const {string} */
visflow.diagram.LOAD_URL = './server/load.php';
/** @const {string} */
visflow.diagram.SAVE_URL = './server/save.php';

/**
 * Last used diagram name.
 * @type {string}
 */
visflow.diagram.lastFilename = 'myDiagram';

/**
 * Saves the current flow.
 */
visflow.diagram.save = function() {
  var manager = this;
  $.post('./server/load.php', {
    type: 'filelist'
  }).done(function(data) {
    var fileList = data.filelist;
    var fileNames = visflow.utils.keySet(fileList.map(function(file) {
      return file.filename;
    }));

    visflow.dialog.create({
      template: './src/dialog/save-diagram.html',
      complete: function (dialog) {
        var input = dialog.find('input').val(visflow.flow.lastFilename);
        var confirm = dialog.find('#confirm');

        input.on('keyup', function() {
          confirm.prop('disabled', $(this).val() == '');
        });
        confirm.click(function(event) {
          var fileName = input.val();
          if (fileName in fileNames) {
            // Another modal will be loaded immediately.
            // So we prevent modal close here.
            event.stopPropagation();

            visflow.diagram.uploadOverwrite_(fileName);
          } else {
            visflow.diagram.upload_(fileName);
          }
        });

        var table = dialog.find('table');
        visflow.diagram.listTable_(table, fileList);
        table.on('select.dt', function() {
          fileName = table.find('tr.selected').children().first().text();
          input.val(fileName);
        });
      }
    });
  }).fail(function() {
    visflow.error('failed to get diagram list (connection error)');
  });
};


/**
 * Loads a saved flow diagram.
 */
visflow.diagram.load = function() {
  $.post(visflow.diagram.LOAD_URL, {
    type: 'filelist'
  }).done(function(data) {
    var fileList = data.filelist;

    visflow.dialog.create({
      template: './src/dialog/load-diagram.html',
      complete: function (dialog) {
        var fileName = visflow.flow.lastFilename;

        var confirm = dialog.find('#confirm').prop('disabled', true)
          .click(function() {
            visflow.diagram.download_(fileName);
          });

        var table = dialog.find('table');
        visflow.diagram.listTable_(table, fileList);
        table.on('select.dt', function() {
          fileName = table.find('tr.selected').children().first().text();
          confirm.prop('disabled', false);
        });
      }
    });
  }).fail(function() {
    visflow.error('failed to get diagram list (connection error)');
  });
};

/**
 * Creates a new flow diagram.
 */
visflow.diagram.new = function() {
  visflow.dialog.create({
    template: './src/dialog/new-diagram.html',
    complete: function(dialog) {
      dialog.find('#confirm').click(function() {
        visflow.flow.lastFilename = 'myDiagram';
        visflow.flow.clearFlow();
      });
    }
  });
};

/**
 * Downloads a flow diagram file from the server.
 * @param {string} filename
 * @private
 */
visflow.diagram.download_ = function(filename) {
  visflow.diagram.lastFilename = filename;
  $.post(visflow.diagram.LOAD_URL, {
    type: 'download',
    filename: filename
  }).done(function(data) {
      if (data.status != 'success') {
        visflow.error('failed to download diagram', data.msg);
      } else {
        visflow.flow.deserializeFlow(data.diagram);
      }
    })
    .fail(function() {
      visflow.error('failed to download diagram (connection error)');
    });
};

/**
 * Uploads the current flow to server and saves it as 'filename'.
 * @param {string} filename
 * @private
 */
visflow.diagram.upload_ = function(filename) {
  visflow.diagram.lastFilename = filename;
  $.post(visflow.diagram.SAVE_URL, {
    filename: filename,
    flow: JSON.stringify(visflow.flow.serializeFlow())
  }).done(function(data) {
      if (data.status == 'success') {
        visflow.success('diagram upload successful:', data.filename);
      } else {
        visflow.error('failed to save diagram', data.msg);
      }
    })
    .fail(function() {
      visflow.error('failed to save diagram (connection error)');
    });
};

/**
 * Asks for confirmation about overwriting diagram file.
 * @param {string} fileName
 * @private
 */
visflow.diagram.uploadOverwrite_ = function(fileName) {
  visflow.dialog.create({
    template: './src/dialog/overwrite-diagram.html',
    complete: function(dialog) {
      dialog.find('label').text(fileName);
      dialog.find('#confirm').click(function() {
        visflow.diagram.upload_(fileName);
      });
    }
  });
};

/**
 * Shows a table with list of diagrams saved on server.
 * @param {!jQuery} table
 * @param {!Array<{filename: string, mtime: number}>} fileList
 * @private
 */
visflow.diagram.listTable_ = function(table, fileList) {
  table.DataTable({
    data: fileList,
    select: 'single',
    pagingType: 'full',
    columns: [
      {title: 'File Name', data: 'filename'},
      {title: 'Last Modified', data: 'mtime'}
    ],
    columnDefs: [
      {
        render: function (lastModified) {
          return (new Date(lastModified)).toLocaleString();
        },
        targets: 1
      }
    ]
  });
};
