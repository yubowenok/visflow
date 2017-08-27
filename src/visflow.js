/**
 * @fileoverview VisFlow namespace. System entry.
 */

/**
 * System kernel namespace.
 * @const
 */
var visflow = {};

/**
 * Initializes all visflow components.
 */
visflow.init = function() {
  visflow.scales.init();

  visflow.menu.init();
  visflow.viewManager.init();
  visflow.flow.init();
  visflow.optionPanel.init();
  visflow.nodePanel.init();
  visflow.popupPanel.init();
  visflow.toolPanel.init();
  visflow.interaction.init();
  // visflow.nlp.init();

  visflow.user.init();
};

/**
 * Tests if the client is using mobile device.
 * @return {boolean}
 */
visflow.isMobile = function() {
  return isMobile.phone || isMobile.tablet;
};

/**
 * Opens a documentation page.
 */
visflow.documentation = function() {
  window.open('doc.html');
};

/**
 * Opens an about dialog.
 */
visflow.about = function() {
  visflow.dialog.create({
    template: './dist/html/about/about.html'
  });
};


/**
 * Debugging global entry that is used to retrieve variable values.
 * @type {*}
 */
visflow.debug = null;
