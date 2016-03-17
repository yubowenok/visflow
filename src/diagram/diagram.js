/**
 * @fileoverview Diagram related functions.
 */

/** @const */
visflow.diagram = {};

/**
 * Last used diagram info.
 * @type {{
 *   id: number,
 *   name: string,
 *   shareWith: string
 * }}
 */
visflow.diagram.lastDiagram = {
  id: -1,
  name: 'myDiagram',
  shareWith: ''
};

/**
 * @typedef {{
 *   id: number,
 *   name: string,
 *   mtime: number,
 *   owner: string,
 *   shareWith: string
 * }}
 */
visflow.diagram.Info;

/** @private @const {string} */
visflow.diagram.NEW_DIALOG_ = './dist/html/diagram/new-diagram.html';
/** @private @const {string} */
visflow.diagram.DELETE_DIALOG_ = './dist/html/diagram/delete-diagram.html';
/** @private @const {string} */
visflow.diagram.SAVE_DIALOG_ = './dist/html/diagram/save-diagram.html';
/** @private @const {string} */
visflow.diagram.LOAD_DIALOG_ = './dist/html/diagram/load-diagram.html';
/** @private @const {string} */
visflow.diagram.OVERWRITE_DIALOG_ =
  './dist/html/diagram/overwrite-diagram.html';

/**
 * Saves the current flow.
 */
visflow.diagram.save = function() {
  if (!visflow.user.writePermission()) {
    visflow.user.login('you must login to save diagram');
    return;
  }
  $.post(visflow.url.LIST_DIAGRAM)
    .done(function(data) {
      var fileList = data;
      visflow.dialog.create({
        template: visflow.diagram.SAVE_DIALOG_,
        complete: visflow.diagram.saveDialog_,
        params: {
          fileList: fileList
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
      var fileList = data;

      visflow.dialog.create({
        template: visflow.diagram.LOAD_DIALOG_,
        complete: function(dialog) {
          var diagramId = visflow.diagram.lastDiagram.id;

          var confirm = dialog.find('#confirm').prop('disabled', true)
            .click(function() {
              visflow.diagram.download(diagramId);
            });

          var table = dialog.find('table');
          visflow.diagram.listTable_(table, fileList);
          table.on('select.dt', function(event, dt, type, tableIndices) {
            var index = _.first(tableIndices);
            diagramId = fileList[index].id;
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
        visflow.diagram.lastDiagram = {
          id: -1,
          name: 'myDiagram',
          shareWith: ''
        };
        visflow.diagram.updateURL(-1);
        visflow.flow.clearFlow();
      });
    }
  });
};

/**
 * Deletes a flow diagram.
 * @param {number} diagramId
 * @param {number} diagramName
 */
visflow.diagram.delete = function(diagramId, diagramName) {
  visflow.dialog.create({
    template: visflow.diagram.DELETE_DIALOG_,
    complete: function(dialog) {
      dialog.find('.diagram-name').text(diagramName);
      dialog.find('#confirm').click(function() {
        $.post(visflow.url.DELETE_DIAGRAM, {
          id: diagramId
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
 * @param {number} id
 */
visflow.diagram.download = function(id) {
  if (!visflow.user.loggedIn()) {
    visflow.user.login('you must login to download a diagram');
    return;
  }
  $.post(visflow.url.LOAD_DIAGRAM, {
    id: id
  }).done(function(data) {
      visflow.diagram.lastDiagram = {
        id: data.id,
        name: data.name,
        shareWith: data.shareWith
      };
      visflow.flow.deserializeFlow(data.diagram);
      visflow.diagram.updateURL(id);
    })
    .fail(function(res) {
      visflow.error('failed to download diagram:', res.responseText);
    });
};

/**
 * Sets up the save diagram dialog.
 * @param {!jQuery} dialog
 * @param {{
 *   fileList: !Array<visflow.diagram.Info>
 * }} params
 * @private
 */
visflow.diagram.saveDialog_ = function(dialog, params) {
  var fileList = params.fileList;
  var diagramIdInfos = {};
  var diagramNameInfos = {}; // only contains user's own diagrams
  fileList.forEach(function(diagramInfo) {
    diagramIdInfos[diagramInfo.id] = diagramInfo;
    if (diagramInfo.owner === '') {
      diagramNameInfos[diagramInfo.name] = diagramInfo;
    }
  });

  var diagramName = visflow.diagram.lastDiagram.name;
  var diagramId = visflow.diagram.lastDiagram.id;
  var isOwner = diagramId == -1 || diagramIdInfos[diagramId].owner === '';
  var nameInput = dialog.find('#diagram-name')
    .val(visflow.diagram.lastDiagram.name)
    .prop('disabled', !isOwner);

  var confirm = dialog.find('#confirm');
  var shareWith = dialog.find('#share-with')
    .val(visflow.diagram.lastDiagram.shareWith)
    .prop('disabled', !isOwner);

  var saveReady = function() {
    confirm.prop('disabled', diagramName === '');
  };

  nameInput.on('keyup', function() {
    diagramName = nameInput.val();
    saveReady();
  });

  confirm.click(function(event) {
    var shareWith_ = /** @type {string} */(shareWith.val());
    if (!isOwner || (isOwner && diagramName in diagramNameInfos)) {
      // Another modal will be loaded immediately.
      // So we prevent modal close here.
      event.stopPropagation();

      visflow.diagram.uploadOverwrite_({
        id: diagramId,
        name: diagramName,
        shareWith: shareWith_
      });
    } else {
      visflow.diagram.upload_({
        id: -1,
        name: diagramName,
        shareWith: shareWith_
      });
    }
  });

  var dt = visflow.diagram.listTable_(dialog.find('table'), fileList);
  if (diagramId != -1) {
    dt.rows(function(index, data) {
      return data.id == diagramId;
    }).select();
  }
  dt.on('select.dt', function(event, dt, type, tableIndices) {
    var info = /** @type {DataTables} */(dt).row(tableIndices[0]).data();
    diagramId = info.id;
    diagramName = info.name;
    isOwner = diagramIdInfos[diagramId].owner === '';
    // reflect selected diagram info
    nameInput.val(diagramName)
      .prop('disabled', !isOwner);
    shareWith.val(info.shareWith)
      .prop('disabled', !isOwner);
    saveReady();
  }).on('deselect.dt', function() {
    diagramId = -1;
    isOwner = true;
    nameInput.prop('disabled', !isOwner);
    shareWith.prop('disabled', !isOwner).val('');
    saveReady();
  });
};

/**
 * Uploads the current flow to server and saves it as 'filename'.
 * @param {{
 *   id: number,
 *   name: string,
 *   shareWith: string
 * }} diagramInfo
 * @private
 */
visflow.diagram.upload_ = function(diagramInfo) {
  $.post(visflow.url.SAVE_DIAGRAM, {
    id: diagramInfo.id,
    name: diagramInfo.name,
    shareWith: diagramInfo.shareWith,
    flow: JSON.stringify(visflow.flow.serializeFlow())
  }).done(function(info) {
      visflow.diagram.lastDiagram = {
        id: info.id,
        name: info.name,
        shareWith: info.shareWith
      };
      visflow.success('diagram saved:', info.name);
      visflow.diagram.updateURL(info.id);
    })
    .fail(function(res) {
      visflow.error('failed to save diagram:', res.responseText);
    });
};

/**
 * Updates the window URL without refreshing the page to reflect the new diagram
 * name.
 * @param {number} id
 */
visflow.diagram.updateURL = function(id) {
  if (id == null || id == -1) {
    visflow.error('invalid diagram id received at updateURL');
  }
  if (history.pushState) {
    var url = window.location.protocol + '//' + window.location.host +
      window.location.pathname + '?diagram=' + id;
    window.history.pushState({path: url}, '', url);
  }
};

/**
 * Asks for confirmation about overwriting diagram file.
 * @param {{
 *   id: number,
 *   name: string,
 *   shareWith: string
 * }} diagramInfo
 * @private
 */
visflow.diagram.uploadOverwrite_ = function(diagramInfo) {
  visflow.dialog.create({
    template: visflow.diagram.OVERWRITE_DIALOG_,
    complete: function(dialog) {
      dialog.find('label').text(diagramInfo.name);
      dialog.find('#confirm').click(function() {
        visflow.diagram.upload_(diagramInfo);
      });
    }
  });
};


/**
 * Shows a table with list of diagrams saved on server.
 * @param {!jQuery} table
 * @param {!Array<visflow.diagram.Info>} fileList
 * @return {DataTables}
 * @private
 */
visflow.diagram.listTable_ = function(table, fileList) {
  var diagramInfo = {};
  fileList.forEach(function(info) {
    diagramInfo[info.id] = info;
  });
  return table.DataTable({
    data: fileList,
    select: 'single',
    pagingType: 'full',
    pageLength: 5,
    lengthMenu: [5, 10, 20],
    order: [
      [1, 'desc']
    ],
    columns: [
      {title: 'File Name', data: 'name'},
      {title: 'Last Modified', data: 'mtime'},
      {title: 'Owner', data: 'owner'},
      {title: '', data: 'id'}
    ],
    columnDefs: [
      {
        render: function(lastModified) {
          return (new Date(lastModified)).toLocaleString();
        },
        targets: 1
      },
      {
        render: function(diagramId) {
          return [
            '<span class="btn btn-default btn-xs glyphicon glyphicon-trash ',
            !visflow.user.writePermission() ||
              diagramInfo[diagramId].owner !== '' ? 'disabled' : '',
            '" ',
            'diagram-id="',
            diagramId,
            '">',
            '</span>'
          ].join('');
        },
        targets: 3
      }
    ],
    drawCallback: function() {
      // The event handler still exists on the same element, when it is redrawn
      // by search (the element persists). Therefore we need to off the handler.
      table.find('tr .glyphicon-trash')
        .off('click')
        .click(function(event) {
          var diagramId = $(event.target).attr('diagram-id');
          visflow.diagram.delete(+diagramId, diagramInfo[diagramId].name);
          event.stopPropagation();
        });
    }
  });
};
