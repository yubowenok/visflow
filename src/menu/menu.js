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

  var register = navbar.find('#register');
  register.click(function() {
    visflow.user.register();
  });
  var login = navbar.find('#login');
  login.click(function() {
    visflow.user.login();
  });
  var logout = navbar.find('#logout');
  logout.click(function() {
    visflow.user.logout();
  });
  var username = navbar.find('#username');
  username.click(function() {
    visflow.user.profile();
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
  $(visflow.options).on('vf.change', function(event, data) {
    var value = data.value;
    switch (data.type) {
      case 'nodeLabel':
        $('#options #show-node-label > i').toggleClass('glyphicon-ok', value);
        visflow.flow.updateNodeLabels();
        break;
    }
  });

  var navbar = $('.visflow > .navbar-fixed-top');
  $(visflow.user)
    .on('vf.login', function() {
      navbar.find('.logged-in').show();
      navbar.find('.logged-out').hide();
      navbar.find('#username').text(visflow.user.account.username);
    })
    .on('vf.logout', function() {
      navbar.find('.logged-out').show();
      navbar.find('.logged-in').hide();
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
