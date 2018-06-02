/**
 * @fileoverview Visflow user login and registration.
 */

/** @const */
visflow.user = {};

/**
 * Login account information.
 * @type {?{
 *   username: string
 * }}
 */
visflow.user.account = null;

/** @private @const {string} */
visflow.user.REGISTER_TEMPLATE_ = './dist/html/user/register-dialog.html';
/** @private @const {string} */
visflow.user.LOGIN_TEMPLATE_ = './dist/html/user/login-dialog.html';
/** @private @const {string} */
visflow.user.PROFILE_TEMPLATE_ = './dist/html/user/profile-dialog.html';

/** @private @const {string} */
visflow.user.USERNAME_REGEX_ = '^[a-z0-9_]+$';
/** @private @const {string} */
visflow.user.EMAIL_REGEX_ =
  '^(([^<>()[\\]\\\\.,;:\\s@"]+(\\.[^<>()[\\]\\\\.,;:\\s@"]+)' +
  '*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|' +
  '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';

/** @private @const {number} */
visflow.user.MIN_USERNAME_LENGTH_ = 6;

/** @private @const {number} */
visflow.user.MIN_PASSWORD_LENGTH_ = 8;

/**
 * Keywords contained in logout session expired message.
 * @private @const {string}
 */
visflow.user.LOGOUT_EXPIRED_MSG_ = 'session expired';

/**
 * Callback function that will be called after the user logs in.
 * @type {?function()}
 */
visflow.user.loginHook = function() {
  var diagramId = location.search.split('diagram=')[1];
  if (diagramId !== undefined) {
    visflow.diagram.download(+diagramId);
    if (visflow.user.loggedIn()) {
      visflow.user.loginHook = null;
    }
  } else if (!visflow.user.loggedIn()) {
    visflow.welcome.init();
  }
};

/**
 * Gets the current logged-in username.
 * @return {string}
 */
visflow.user.currentUsername = function() {
  return visflow.user.account != null ? visflow.user.account.username : '';
};

/**
 * Initializes user settings.
 */
visflow.user.init = function() {
  visflow.user.authenticate();
};

/**
 * Shows a registration dialog.
 */
visflow.user.register = function() {
  visflow.dialog.create({
    template: visflow.user.REGISTER_TEMPLATE_,
    complete: visflow.user.registerDialog_
  });
};

/**
 * Shows a login dialog.
 * @param {string=} message
 */
visflow.user.login = function(message) {
  visflow.dialog.create({
    template: visflow.user.LOGIN_TEMPLATE_,
    complete: visflow.user.loginDialog_,
    params: {
      message: message
    }
  });
};

/**
 * Logins in the demo account.
 */
visflow.user.loginDemo = function() {
  $.post(visflow.url.LOGIN, {
    username: 'demo',
    password: 'demo'
  }).done(function() {
    visflow.dialog.close();
    visflow.success('working in demo mode');
    visflow.user.authenticate();
  }).fail(function(res) {
    visflow.error(res.responseText);
  });
};

/**
 * Shows the user profile dialog.
 */
visflow.user.profile = function() {
  visflow.dialog.create({
    template: visflow.user.PROFILE_TEMPLATE_,
    complete: visflow.user.profileDialog_
  });
};

/**
 * Checks whether the user has logged in.
 * @return {boolean}
 */
visflow.user.loggedIn = function() {
  return visflow.user.account != null;
};

/**
 * Checks whether the user can upload data or save diagram.
 * @return {boolean}
 */
visflow.user.writePermission = function() {
  return visflow.user.loggedIn();//&& visflow.user.account.username != 'demo';
};

/**
 * Logs out the current user.
 */
visflow.user.logout = function() {
  $.post(visflow.url.LOGOUT)
    .done(function() {
      visflow.dialog.close();
      visflow.success('logout successful');
    })
    .fail(function(res) {
      var error = res.responseText;
      if (error.match(visflow.user.LOGOUT_EXPIRED_MSG_) != null) {
        visflow.warning('session expired');
      } else {
        visflow.error(error);
      }
    })
    .always(function() {
      visflow.user.account = null;
      visflow.signal(visflow.user, visflow.Event.LOGOUT);
    });
};

/**
 * Uses the cookie session to authenticate.
 */
visflow.user.authenticate = function() {
  var sessionId = Cookies.get('PHPSESSID');
  if (sessionId !== undefined) {
    $.post(visflow.url.AUTH)
      .done(function(username) {
        visflow.user.account = {
          username: username
        };
        visflow.signal(visflow.user, visflow.Event.LOGIN);
      })
      .fail(function() {
        visflow.user.account = null;
        visflow.signal(visflow.user, visflow.Event.LOGOUT);
      })
      .always(function() {
        visflow.user.callLoginHook();
      });
  } else {
    visflow.signal(visflow.user, visflow.Event.LOGOUT);
    visflow.user.callLoginHook();
  }
};

/**
 * Displays an error message in the dialog.
 * @param {!jQuery} dialog
 * @param {string} text
 */
visflow.user.error = function(dialog, text) {
  var error = dialog.find('.error');
  if (text === '') {
    error.hide();
    return;
  }
  error.show().text(text);
};

/**
 * Displays a warning message in the dialog.
 * @param {!jQuery} dialog
 * @param {string} text
 */
visflow.user.warning = function(dialog, text) {
  var warning = dialog.find('.warning');
  if (text === '') {
    warning.hide();
    return;
  }
  warning.show().text(text);
};

/**
 * Sets up the dialog for user registration.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.registerDialog_ = function(dialog) {
  var confirm = dialog.find('#confirm').prop('disabled', true);
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var repeatPassword = dialog.find('#repeat-password');
  var email = dialog.find('#email');
  var error = dialog.find('.error');

  var fieldsComplete = function() {
    var passwordsMatch = password.val() === repeatPassword.val();
    var passwordNonEmpty = password.val() !== '';
    var repeatPasswordNonEmpty = repeatPassword.val() !== '';
    var usernameNonEmpty = username.val() !== '';

    if (passwordNonEmpty && repeatPasswordNonEmpty && !passwordsMatch) {
      visflow.user.error(dialog, 'passwords do not match');
    }

    var emailNonEmpty = email.val() !== '';
    return passwordsMatch && passwordNonEmpty && usernameNonEmpty &&
        emailNonEmpty;
  };

  var inputChanged = function() {
    visflow.user.error(dialog, '');
    confirm.prop('disabled', !fieldsComplete());
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  confirm.click(function() {
    var username_ = username.val();
    var password_ = password.val();
    var email_ = email.val();
    if (!RegExp(visflow.user.EMAIL_REGEX_).test(email_)) {
      visflow.user.error(dialog, 'invalid email address');
    } else if (!RegExp(visflow.user.USERNAME_REGEX_).test(username_)) {
      visflow.user.error(dialog, 'username may only contain lowercase ' +
        'letters, digits and underscores');
    } else if (username_.length < visflow.user.MIN_USERNAME_LENGTH_) {
      visflow.user.error(dialog, 'username length must be at least ' +
        visflow.user.MIN_USERNAME_LENGTH_);
    } else if (password_.length < visflow.user.MIN_PASSWORD_LENGTH_) {
      visflow.user.error(dialog, 'password length must be at least ' +
        visflow.user.MIN_PASSWORD_LENGTH_);
    } else {
      // all conditions match
      $.post(visflow.url.REGISTER, {
        username: username_,
        password: password_,
        email: email_
      }).done(function() {
        visflow.dialog.close();
        visflow.success('registration successful');
        visflow.user.authenticate();
      }).fail(function(res) {
        // text error response
        visflow.user.error(dialog, res.responseText);
      });
    }
  });
};

/**
 * Sets up the dialog for user login.
 * @param {!jQuery} dialog
 * @param {{
 *   message: string
 * }=} params
 * @private
 */
visflow.user.loginDialog_ = function(dialog, params) {
  var btn = dialog.find('#confirm');
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var error = dialog.find('.error');

  if (params !== undefined) {
    if (params.message) {
      visflow.user.warning(dialog, params.message);
    }
  }

  // Shortcut links
  dialog.find('#register')
    .click(function() {
      visflow.user.register();
    });
  dialog.find('#try-demo')
    .click(function() {
      visflow.user.loginDemo();
    });

  btn.prop('disabled', true);

  var fieldsComplete = function() {
    var passwordNonEmpty = password.val() !== '';
    var usernameNonEmpty = username.val() !== '';
    return passwordNonEmpty && usernameNonEmpty;
  };

  var inputChanged = function(event) {
    var complete = fieldsComplete();
    if (event.which == visflow.interaction.keyCodes.ENTER && complete) {
      // Attempt to submit
      btn.trigger('click');
    }
    visflow.user.error(dialog, '');
    btn.prop('disabled', !complete);
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  btn.click(function() {
    var username_ = username.val();
    var password_ = password.val();

    $.post(visflow.url.LOGIN, {
      username: username_,
      password: password_
    }).done(function() {
      visflow.dialog.close();
      visflow.success('login successful');
      visflow.user.authenticate();
    }).fail(function(res) {
      // text error response
      visflow.user.error(dialog, res.responseText);
    });
  });
};

/**
 * Sets up the dialog for user profile edit.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.profileDialog_ = function(dialog) {
  var confirm = dialog.find('#confirm').prop('disabled', true);
  var oldPassword = dialog.find('#old-password');
  var password = dialog.find('#password');
  var repeatPassword = dialog.find('#repeat-password');
  var email = dialog.find('#email');
  var error = dialog.find('.error');

  var fieldsComplete = function() {
    var oldPasswordNonEmpty = oldPassword.val() !== '';
    var passwordsMatch = password.val() === repeatPassword.val();
    var passwordNonEmpty = password.val() !== '';
    var repeatPasswordNonEmpty = repeatPassword.val() !== '';
    var emailNonEmpty = email.val() !== '';

    if (passwordNonEmpty && repeatPasswordNonEmpty && !passwordsMatch) {
      visflow.user.error(dialog, 'passwords do not match');
    }

    return oldPasswordNonEmpty && ((passwordNonEmpty && passwordsMatch) ||
      emailNonEmpty);
  };

  var inputChanged = function() {
    visflow.user.error(dialog, '');
    confirm.prop('disabled', !fieldsComplete());
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  confirm.click(function() {
    var oldPassword_ = oldPassword.val();
    var password_ = password.val();
    var email_ = email.val();
    if (email_ !== '' && !RegExp(visflow.user.EMAIL_REGEX_).test(email_)) {
      visflow.user.error(dialog, 'invalid email address');
    } else if (password_ !== '' &&
      password_.length < visflow.user.MIN_PASSWORD_LENGTH_) {
      visflow.user.error(dialog, 'password length must be at least ' +
        visflow.user.MIN_PASSWORD_LENGTH_);
    } else {
      $.post(visflow.url.PROFILE, {
        oldPassword: oldPassword_,
        password: password_,
        email: email_
      }).done(function() {
        visflow.dialog.close();
        visflow.success('profile updated');
      }).fail(function(res) {
        visflow.user.error(dialog, res.responseText);
      });
    }
  });
};

/**
 * Executes the login hook and sets the hook to null.
 */
visflow.user.callLoginHook = function() {
  if (visflow.user.loginHook != null) {
    visflow.user.loginHook();
  }
};
