/**
 * @fileoverview Fixed top menu (navbar) for VisFlow.
 */

'use strict';

/** @const */
visflow.menu = {};

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
    visflow.viewManager.showAddPanel();
  });
  edit.find('#panel').click(function() {
    visflow.viewManager.showAddPanel();
  });

  // VisMode button
  navbar.find('#vis-mode')
    .click(function() {
      visflow.flow.toggleVisMode();
    })
    .on('mouseenter', function() {
      visflow.flow.previewVisMode(true);
    })
    .on('mouseleave', function() {
      visflow.flow.previewVisMode(false);
    });

  var help = navbar.find('#help');
  help.find('#documentation').click(function() {
    visflow.documentation();
  });
  help.find('#about').click(function() {
    visflow.about();
  });
};
