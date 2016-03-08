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
visflow.user.REGISTER_TEMPLATE_ = './dist/html/register-dialog.html';
/** @private @const {string} */
visflow.user.LOGIN_TEMPLATE_ = './dist/html/login-dialog.html';

/** @private @const {string} */
visflow.user.REGISTER_URL_ = './server/register.php';
/** @private @const {string} */
visflow.user.LOGIN_URL_ = './server/login.php';
/** @private @const {string} */
visflow.user.LOGOUT_URL_ = './server/logout.php';
/** @private @const {string} */
visflow.user.AUTH_URL_ = './server/auth.php';

/** @private @const {string} */
visflow.user.USERNAME_REGEX_ = '[a-z0-9_]+';
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
 */
visflow.user.login = function() {
  visflow.dialog.create({
    template: visflow.user.LOGIN_TEMPLATE_,
    complete: visflow.user.loginDialog_
  });
};

/**
 * Logs out the current user.
 */
visflow.user.logout = function() {
  $.post(visflow.user.LOGOUT_URL_)
    .done(function() {
      visflow.dialog.close();
      visflow.success('logout successful');
      visflow.signal(visflow.user, 'logout');
    }).fail(function(res) {
      // text error response
      visflow.error(res.responseText);
    });
};

/**
 * Uses the cookie session to authenticate.
 */
visflow.user.authenticate = function() {
  var sessionId = Cookies.get('PHPSESSID');
  if (sessionId !== undefined) {
    $.post(visflow.user.AUTH_URL_)
      .done(function(username) {
        visflow.user.account = {
          username: username
        };
        visflow.signal(visflow.user, 'login');
      })
      .fail(function() {
        visflow.signal(visflow.user, 'logout');
      });
  } else {
    visflow.signal(visflow.user, 'logout');
  }
};

/**
 * Displays an alert message in the dialog.
 * @param {!jQuery} dialog
 * @param {string} text
 */
visflow.user.alert = function(dialog, text) {
  var alert = dialog.find('.alert');
  if (text === '') {
    alert.hide();
    return;
  }
  alert.show().text(text);
};

/**
 * Sets up the dialog for user registration.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.registerDialog_ = function(dialog) {
  var btn = dialog.find('#confirm');
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var repeatPassword = dialog.find('#repeat-password');
  var email = dialog.find('#email');
  var alert = dialog.find('.alert');
  btn.prop('disabled', true);

  var fieldsComplete = function() {
    var passwordsMatch = password.val() === repeatPassword.val();
    var passwordNonEmpty = password.val() !== '';
    var usernameNonEmpty = username.val() !== '';
    var emailNonEmpty = email.val() !== '';
    return passwordsMatch && passwordNonEmpty && usernameNonEmpty &&
        emailNonEmpty;
  };

  var inputChanged = function() {
    visflow.user.alert(dialog, '');
    btn.prop('disabled', !fieldsComplete());
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  btn.click(function() {
    var username_ = username.val();
    var password_ = password.val();
    var email_ = email.val();
    if (password_ !== repeatPassword.val()) {
      visflow.user.alert(dialog, 'passwords mismatch');
    } else if (!RegExp(visflow.user.EMAIL_REGEX_).test(email_)) {
      visflow.user.alert(dialog, 'invalid email address');
    } else if (!RegExp(visflow.user.USERNAME_REGEX_).test(username_)) {
      visflow.user.alert(dialog, 'username may only contain lowercase ' +
        'letters, digits and underscores');
    } else if (username_.length < visflow.user.MIN_USERNAME_LENGTH_) {
      visflow.user.alert(dialog, 'username length must be at least ' +
        visflow.user.MIN_USERNAME_LENGTH_);
    } else if (password_.length < visflow.user.MIN_PASSWORD_LENGTH_) {
      visflow.user.alert(dialog, 'password length must be at least ' +
        visflow.user.MIN_PASSWORD_LENGTH_);
    } else {
      // all conditions match
      $.post(visflow.user.REGISTER_URL_, {
        username: username_,
        password: password_,
        email: email_
      }).done(function() {
        visflow.dialog.close();
        visflow.success('registration successful');
        visflow.user.authenticate();
      }).fail(function(res) {
        // text error response
        visflow.user.alert(dialog, res.responseText);
      });
    }
  });
};

/**
 * Sets up the dialog for user login.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.loginDialog_ = function(dialog) {
  var btn = dialog.find('#confirm');
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var alert = dialog.find('.alert');
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
    visflow.user.alert(dialog, '');
    btn.prop('disabled', !complete);
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  btn.click(function() {
    var username_ = username.val();
    var password_ = password.val();

    $.post(visflow.user.LOGIN_URL_, {
      username: username_,
      password: password_,
    }).done(function() {
      visflow.dialog.close();
      visflow.success('login successful');
      visflow.user.authenticate();
    }).fail(function(res) {
      // text error response
      visflow.user.alert(dialog, res.responseText);
    });
  });
};
