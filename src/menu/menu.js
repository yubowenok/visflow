/**
 * @fileoverview Fixed top menu (navbar) for VisFlow.
 */

'use strict';

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

  // Alt hold
  var alted = navbar.find('#alted');
  alted.click(function() {
    visflow.interaction.toggleAltHold();
    visflow.menu.updateAlt();
  });

  // VisMode button
  var visMode = navbar.find('#vis-mode');
  visMode
    .click(function() {
      visflow.flow.toggleVisMode();
    })
    .on('mouseenter', function() {
      if (!visflow.flow.visMode) {
        visflow.flow.previewVisMode(true);
      }
    })
    .on('mouseleave', function() {
      if (!visflow.flow.visMode) {
        visflow.flow.previewVisMode(false);
      }
    });

  var help = navbar.find('#help');
  help.find('#documentation').click(function() {
    visflow.documentation();
  });
  help.find('#about').click(function() {
    visflow.about();
  });

  var upload = navbar.find('#upload');
  upload.click(function() {
    visflow.upload.dialog();
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
  $(visflow.options).on('visflow.change', function(event, data) {
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
 * Updates the visMode button active state.
 */
visflow.menu.updateVisMode = function() {
  var navbar = $('.visflow > .navbar-fixed-top');
  var visMode = navbar.find('#vis-mode');
  visMode.children('.btn').toggleClass('active', visflow.flow.visMode);
  var addNode = navbar.find('#add-node');
  addNode.toggleClass('disabled', visflow.flow.visMode);
};

/**
 * Updates the alt button's active class to reflect the system's alted state.
 */
visflow.menu.updateAlt = function() {
  var alted = visflow.interaction.isAlted();
  var btnAlt = $('.visflow > .navbar-fixed-top #alted > .btn');
  if (alted) {
    btnAlt.addClass('active');
  } else {
    btnAlt.removeClass('active');
  }
};
