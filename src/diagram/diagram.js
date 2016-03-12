/**
 * @fileoverview Diagram related functions.
 */

/** @const */
visflow.diagram = {};

/**
 * Last used diagram name.
 * @type {string}
 */
visflow.diagram.lastFilename = 'myDiagram';

/** @private @const {string} */
visflow.diagram.NEW_DIALOG_ = './src/diagram/new-diagram.html';
/** @private @const {string} */
visflow.diagram.DELETE_DIALOG_ = './src/diagram/delete-diagram.html';
/** @private @const {string} */
visflow.diagram.SAVE_DIALOG_ = './src/diagram/save-diagram.html';
/** @private @const {string} */
visflow.diagram.OVERWRITE_DIALOG_ = './src/diagram/overwrite-diagram.html';
/** @private @const {string} */
visflow.diagram.LOAD_DIALOG_ = './src/diagram/load-diagram.html';

/**
 * Saves the current flow.
 */
visflow.diagram.save = function() {
  $.post(visflow.url.LIST_DIAGRAM)
    .done(function(data) {
      var fileList = data.filelist;
      var fileNames = _.keySet(fileList.map(function(file) {
        return file.filename;
      }));

      visflow.dialog.create({
        template: visflow.diagram.SAVE_DIALOG_,
        complete: function(dialog) {
          var input = dialog.find('input').val(visflow.diagram.lastFilename);
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
            var fileName = table.find('tr.selected').children().first().text();
            input.val(fileName);
          });
        }
      });
    })
    .fail(function() {
      visflow.error('failed to get diagram list (connection error)');
    });
};


/**
 * Loads a saved flow diagram.
 */
visflow.diagram.load = function() {
  $.post(visflow.url.LIST_DIAGRAM)
    .done(function(data) {
      var data_ = /** @type {{
        filelist: !Array<{filename: string, mtime: number}>
      }} */(data);
      var fileList = data_.filelist;

      visflow.dialog.create({
        template: visflow.diagram.LOAD_DIALOG_,
        complete: function(dialog) {
          var fileName = visflow.diagram.lastFilename;

          var confirm = dialog.find('#confirm').prop('disabled', true)
            .click(function() {
              visflow.diagram.download(fileName);
            });

          var table = dialog.find('table');
          visflow.diagram.listTable_(table, fileList);
          table.on('select.dt', function() {
            fileName = table.find('tr.selected').children().first().text();
            confirm.prop('disabled', false);
          });
        }
      });
    })
    .fail(function() {
      visflow.error('failed to get diagram list (connection error)');
    });
};

/**
 * Creates a new flow diagram.
 */
visflow.diagram.new = function() {
  visflow.dialog.create({
    template: visflow.diagram.NEW_DIALOG_,
    complete: function(dialog) {
      dialog.find('#confirm').click(function() {
        visflow.diagram.lastFilename = 'myDiagram';
        visflow.diagram.updateURL('myDiagram');
        visflow.flow.clearFlow();
      });
    }
  });
};

/**
 * Deletes a flow diagram.
 * @param {string} diagramName
 */
visflow.diagram.delete = function(diagramName) {
  visflow.dialog.create({
    template: visflow.diagram.DELETE_DIALOG_,
    complete: function(dialog) {
      dialog.find('.diagram-name').text(diagramName);
      dialog.find('#confirm').click(function() {
        $.post(visflow.url.DELETE_DIAGRAM, {
          diagramName: diagramName
        }).done(function() {
            visflow.success('diagram deleted:', diagramName);
          })
          .fail(function(res) {
            visflow.error('failed to delete diagram:', res.responseText);
          });
      });
    }
  });
};

/**
 * Downloads a flow diagram file from the server.
 * @param {string} filename
 */
visflow.diagram.download = function(filename) {
  visflow.diagram.lastFilename = filename;
  $.post(visflow.url.LOAD_DIAGRAM, {
    filename: filename
  }).done(function(data) {
      visflow.flow.deserializeFlow(data.diagram);
      visflow.diagram.updateURL(filename);
    })
    .fail(function(res) {
      visflow.error('failed to download diagram:', res.responseText);
    });
};

/**
 * Uploads the current flow to server and saves it as 'filename'.
 * @param {string} filename
 * @private
 */
visflow.diagram.upload_ = function(filename) {
  visflow.diagram.lastFilename = filename;
  $.post(visflow.url.SAVE_DIAGRAM, {
    filename: filename,
    flow: JSON.stringify(visflow.flow.serializeFlow())
  }).done(function() {
      visflow.success('diagram upload successful:', filename);
      visflow.diagram.updateURL(filename);
    })
    .fail(function(res) {
      visflow.error('failed to save diagram:', res.responseText);
    });
};

/**
 * Updates the window URL without refreshing the page to reflect the new diagram
 * name.
 * @param {string} name
 */
visflow.diagram.updateURL = function(name) {
  if (history.pushState) {
    var url = window.location.protocol + '//' + window.location.host +
      window.location.pathname + '?diagram=' + name;
    window.history.pushState({path: url}, '', url);
  }
};

/**
 * Asks for confirmation about overwriting diagram file.
 * @param {string} fileName
 * @private
 */
visflow.diagram.uploadOverwrite_ = function(fileName) {
  visflow.dialog.create({
    template: visflow.diagram.OVERWRITE_DIALOG_,
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
    pageLength: 5,
    lengthMenu: [5, 10, 20],
    order: [
      [1, 'desc']
    ],
    columns: [
      {title: 'File Name', data: 'filename'},
      {title: 'Last Modified', data: 'mtime'},
      {title: '', data: 'filename'}
    ],
    columnDefs: [
      {
        render: function(lastModified) {
          return (new Date(lastModified)).toLocaleString();
        },
        targets: 1
      },
      {
        render: function() {
          return '<span class="btn btn-default btn-xs glyphicon ' +
            'glyphicon-trash"></span>';
        },
        targets: 2
      }
    ],
    drawCallback: function() {
      // The event handler still exists on the same element, when it is redrawn
      // by search (the element persists). Therefore we need to off the handler.
      table.find('tr .glyphicon-trash')
        .off('click')
        .click(function(event) {
          var tr = $(event.target).closest('tr');
          var diagramName = tr.children('td:nth-child(1)').text();
          visflow.diagram.delete(/** @type {string} */(diagramName));
          event.stopPropagation();
        });
    }
  });
};
