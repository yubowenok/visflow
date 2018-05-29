/**
 * @fileoverview VisFlow views menu.
 */

/** @const */
visflow.view = {};

/**
 * Initializes view dropdown.
 * @param {!jQuery} navbar
 */
visflow.view.initDropdown = function(navbar) {
  var view = navbar.find('#view');
  view.find('#show-node-label').click(function() {
    visflow.options.toggleNodeLabel(); // TODO(bowen): check visflow.options
  });
  view.find('#show-node-panel').click(function() {
    visflow.options.toggleNodePanel();
  });

  visflow.view.initEventListeners_();
};


/**
 * Initializes listeners for view dropdown.
 * @private
 */
visflow.view.initEventListeners_ = function() {
  var view = $('#view');
  // Change "show-node-panel" button visibility.
  visflow.listenMany(visflow.options, [
    {
      event: visflow.Event.DIAGRAM_EDITABLE,
      callback: function() {
        view.find('#show-node-panel')
          .toggleClass('disabled', !visflow.options.isDiagramEditable());
      }
    },
    {
      event: visflow.Event.NODE_PANEL,
      callback: function(event, value) {
        view.find('#show-node-panel > i').toggleClass('glyphicon-ok', value);
      }
    }
  ]);
  // Change "show-node-label" button visibility.
  visflow.listen(visflow.options, visflow.Event.NODE_LABEL,
    function(event, value) {
      view.find('#show-node-label > i').toggleClass('glyphicon-ok', value);
      visflow.flow.updateNodeLabels();
    });
};
