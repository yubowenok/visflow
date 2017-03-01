/**
 * @fileoverview VisFlow SmartFlow NLP extension.
 */

/** @const */
visflow.nlp = {};

/** @type {boolean} */
visflow.nlp.isWaitingForInput = false;

/** @type {boolean} */
visflow.nlp.isProcessing = false;

/**
 * Initializes NLP events.
 */
visflow.nlp.init = function() {
  $('#nlp-backdrop')
    .mousedown(function() {
      if (visflow.nlp.isProcessing) { // Wait for server response.
        return;
      }
      visflow.nlp.end();
    });
  $('#nlp').on('keyup', 'textarea', function(event) {
    if (event.keyCode == visflow.interaction.keyCodes.ESC) {
      // Force end regardless of server response.
      visflow.nlp.end();
    } else if (event.keyCode == visflow.interaction.keyCodes.ENTER) {
      event.preventDefault();
      visflow.nlp.submit();
    }
  });
};

/**
 * Shows an input box for smart flow input.
 */
visflow.nlp.input = function() {
  visflow.nlp.isWaitingForInput = true;
  visflow.contextMenu.hide();

  $('#nlp').children().remove();

  var div = $('<div></div>')
    .css({
      left: visflow.interaction.mouseX,
      top: visflow.interaction.mouseY
    })
    .appendTo('#nlp');
  $('<label>SmartFlow</label>').appendTo(div);
  $('<textarea></textarea>')
    .addClass('form-control')
    .appendTo(div)
    .focus();
  visflow.nlp.backdrop(true);
};

/**
 * Submits NLP request to the server.
 */
visflow.nlp.submit = function() {
  var textarea = $('#nlp textarea');
  textarea.prop('disabled', 'disabled');
  visflow.nlp.isProcessing = true;

  var query = textarea.val();
  // TODO(bowen): Send query to the server and wait for the response.

  $.post(visflow.url.NLP, {
    query: query
  }).done(function(res) {
      visflow.success('nlp posted:', res);
      visflow.nlp.end();
    })
    .fail(function(res) {
      visflow.error('failed to execute SmartFlow', res.responseText);
    });
};

/**
 * Turns on off the backdrop.
 * @param {boolean} state
 */
visflow.nlp.backdrop = function(state) {
  $('#nlp-backdrop').toggle(state);
};

/**
 * Ends the NLP input.
 */
visflow.nlp.end = function() {
  $('#nlp').children().remove();
  visflow.nlp.backdrop(false);
  visflow.nlp.isWaitingForInput = false;
};
