/**
 * @fileoverview Fixed top menu (navbar) for VisFlow.
 */

/** @const */
visflow.menu = {};

/** @private @const {number} */
visflow.menu.TOOLTIP_DELAY_ = 1000;

/**
 * Initializes the menu.
 */
visflow.menu.init = function() {
  var navbar = $('.visflow > .navbar-fixed-top');

  // Diagram dropdown
  var diagram = navbar.find('#diagram');
  diagram.find('#new').click(function() {
    visflow.diagram.new();
  });
  diagram.find('#save').click(function() {
    visflow.diagram.save();
  });
  diagram.find('#load').click(function() {
    visflow.diagram.load();
  });

  // Edit dropdown
  var edit = navbar.find('#edit');
  edit.find('#add-node').click(function() {
    visflow.nodePanel.toggle(true);
  });

  // Options
  var options = navbar.find('#options');
  options.find('#show-node-label').click(function() {
    visflow.options.toggleNodeLabel();
  });

  var help = navbar.find('#help');
  help.find('#documentation').click(function() {
    visflow.documentation();
  });
  help.find('#about').click(function() {
    visflow.about();
  });

  navbar.find('.to-tooltip').tooltip({
    delay: visflow.menu.TOOLTIP_DELAY_
  });

  visflow.menu.initUpdateHandlers_();
};

/**
 * Initializes the update event handlers for events across systems.
 * @private
 */
visflow.menu.initUpdateHandlers_ = function() {
  $(visflow.options).on('change.visflow', function(event, data) {
    var value = data.value;
    switch (data.type) {
      case 'nodeLabel':
        $('#options #show-node-label > i').toggleClass('glyphicon-ok', value);
        visflow.flow.updateNodeLabels();
        break;
    }
  });
};

/**
 * Updates the enabled/disabled state of the add node item in the menu.
 */
visflow.menu.updateVisMode = function() {
  var navbar = $('.visflow > .navbar-fixed-top');
  var addNode = navbar.find('#add-node');
  addNode.toggleClass('disabled', visflow.flow.visMode);
};
