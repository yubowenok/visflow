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
    visflow.nodePanel.toggle();
  });

  visflow.view.initListeners_();
};


/**
 * Initializes listeners for view dropdown.
 * @private
 */
visflow.view.initListeners_ = function() {
  // Change of nodePanel visibility
  visflow.listen(visflow.nodePanel, visflow.Event.CHANGE,
    function(event, data) {
      var value = data.value;
      switch (data.type) {
        case 'nodePanel':
          $('#view #show-node-panel > i').toggleClass('glyphicon-ok', value);
          break;
      }
    });
  // Change of node label visibility
  visflow.listen(visflow.options, visflow.Event.CHANGE,
    function(event, data) {
      var value = data.value;
      switch (data.type) {
        case 'nodeLabel':
          $('#view #show-node-label > i').toggleClass('glyphicon-ok', value);
          visflow.flow.updateNodeLabels();
          break;
      }
  });
};
