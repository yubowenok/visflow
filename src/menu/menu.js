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

  // Alt hold
  var alted = navbar.find('#alted');
  alted.click(function() {
    visflow.interaction.toggleAltHold();
    visflow.menu.toggleAlt();
  });

  // VisMode button
  var visMode = navbar.find('#vis-mode');
  visMode
    .click(function() {
      visflow.flow.toggleVisMode();
      visMode.children('.btn').toggleClass('active');
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

  navbar.find('.to-tooltip').tooltip({
    delay: visflow.menu.TOOLTIP_DELAY_
  });
};

/**
 * Toggles the active state of the alt button.
 * @param {boolean=} opt_state
 */
visflow.menu.toggleAlt = function(opt_state) {
  var alted = $('.visflow > .navbar-fixed-top #alted > .btn');
  var state = opt_state != null ? opt_state : !alted.hasClass('active');
  if (state) {
    alted.addClass('active');
  } else {
    alted.removeClass('active');
  }
};
