/**
 * @fileoverview Visflow welcome page.
 */

/** @const */
visflow.welcome = {};

/** @private @const {string} */
visflow.welcome.TEMPLATE_ = './dist/html/welcome/welcome.html';

/**
 * Launches the system welcome.
 */
visflow.welcome.init = function() {
  if (!visflow.user.loggedIn()) {
    visflow.dialog.create({
      template: visflow.welcome.TEMPLATE_,
      complete: visflow.welcome.initWelcome_
    });
  }
};

/**
 * Initializes the welcome dialog.
 * @param {!jQuery} dialog
 * @private
 */
visflow.welcome.initWelcome_ = function(dialog) {
  dialog.find('#get-started')
    .click(function() {
      visflow.documentation();
    });
  dialog.find('#create-account')
    .click(function() {
      visflow.user.register();
    });
  dialog.find('#sign-in')
    .click(function() {
      visflow.user.login();
    });
  dialog.find('#try-demo')
    .click(function() {
      visflow.user.loginDemo();
    });
};
