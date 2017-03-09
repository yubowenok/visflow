/**
 * @fileoverview VisFlow SmartFlow NLP extension.
 */

/** @const */
visflow.nlp = {};

/** @type {boolean} */
visflow.nlp.isWaitingForInput = false; // TODO(bowen): doesn't seem to be used?

/** @type {boolean} */
visflow.nlp.isProcessing = false;

/** @type {visflow.Node|undefined} */
visflow.nlp.target = null;

/** @type {boolean} */
visflow.nlp.available = false;

/**
 * Initializes NLP events.
 */
visflow.nlp.init = function() {
  $.post(visflow.url.NLP, {
    query: 'hello'
  }).done(function() {
    visflow.nlp.available = true;

    // Initializes annyang speech recognition.
    visflow.nlp.initSpeech();

    $('#backdrop')
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
        // Submit entered text query.
        var textarea = $('#nlp textarea');
        textarea.prop('disabled', 'disabled');
        visflow.nlp.submit(/** @type {string} */(textarea.val()));
      }
    });
  }).fail(function() {
    // Disable speech button when NLP is unavailable.
    $(visflow.nlp.SPEECH_BUTTON_SELECTOR).prop('disabled', 'disabled');
  });
};

/**
 * Shows an input box for smart flow input.
 * @param {(!visflow.Node|undefined)=} opt_target
 */
visflow.nlp.input = function(opt_target) {
  if (!visflow.nlp.available) {
    visflow.error('NLP service is currently unavailable');
    return;
  }
  visflow.nlp.isWaitingForInput = true;

  // If the input is global, search for a proper target.
  visflow.nlp.target = opt_target ? opt_target : visflow.nlp.findTarget();

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
  visflow.backdrop.toggle(true);
};

/**
 * Accepts NLP input from speech.
 * @param {string} query
 * @param {(!visflow.Node|undefined)=} opt_target
 */
visflow.nlp.speech = function(query, opt_target) {
  if (visflow.nlp.isWaitingForInput) {
    // If the NLP input box is open, then we direct the speech to the input box.
    var textarea = $('#nlp textarea');
    var text = textarea.val();
    textarea.val((text !== '' ? text + ' ' : '') + query);
    return;
  }
  // Search for a proper target.
  visflow.nlp.target = opt_target ? opt_target : visflow.nlp.findTarget();
  visflow.nlp.submit(query);
};

/**
 * Submits NLP query to the server.
 * @param {string} query
 */
visflow.nlp.submit = function(query) {
  visflow.nlp.isProcessing = true;
  var rawQuery = query;
  query = visflow.nlp.processQuery_(query);

  $.post(visflow.url.NLP, {
    query: escape(query)
  }).done(function(res) {
      visflow.nlp.parseResponse_(res, rawQuery);
      visflow.nlp.end();
    })
    .fail(function(res) {
      visflow.error('failed to execute SmartFlow:', res.responseText);
    });
};

/**
 * Searches for a NLP target. Currently returns any of the data sources.
 * @return {visflow.Node}
 */
visflow.nlp.findTarget = function() {
  if (!$.isEmptyObject(visflow.flow.nodesSelected)) {
    // If there is a selection, return any node selected.
    for (var nodeId in visflow.flow.nodesSelected) {
      return visflow.flow.nodes[nodeId];
    }
  }
  if (!visflow.flow.dataSources.length) {
    // Empty diagram.
    // TODO(bowen): find the last uploaded data and create a data source.
    visflow.warning('Errh, first create a data source?');
    return null;
  }
  // Return the nearest node to the mouse position.
  return visflow.flow.closestNodeToMouse();
};

/**
 * Processes the NLP query. Puts in placeholders for chart types and dimensions.
 * Removes stop words.
 * @param {string} query
 * @return {string}
 * @private
 */
visflow.nlp.processQuery_ = function(query) {
  console.log('[target]', visflow.nlp.target);
  query = visflow.nlp.matchChartTypes(query);
  query = visflow.nlp.matchDimensions(query, /** @type {!visflow.Node} */(
    visflow.nlp.target));
  console.log('[query]', query);
  return query;
};

/**
 * Parses the NLP response.
 * @param {string} res HTML response of NLP query.
 * @param {string} query Query parsed.
 * @private
 */
visflow.nlp.parseResponse_ = function(res, query) {
  if (res.match(/0 candidates/) != null) {
    visflow.warning('Sorry, SmartFlow does not understand:', query);
    return;
  }
  var matched = res.match(/Top value \{\n\s*\(string\s*(\S.*\S)\s*\)/);
  if (matched == null) {
    visflow.error('unexpected NLP response');
    console.log(res);
    return;
  }
  var result = matched[1];
  if (result[0] == '"') {
    result = result.match(/"(.*)"/)[1]; // Remove string quotes
  }

  console.log('[response]', result);
  var command = visflow.nlp.mapChartTypes(result);
  command = visflow.nlp.mapDimensions(command);
  console.log('[command]', command);
  visflow.nlp.execute(command, result);
};

/**
 * Ends the NLP input.
 */
visflow.nlp.end = function() {
  $('#nlp').children().remove();
  visflow.backdrop.toggle(false);
  visflow.nlp.isWaitingForInput = false;
};
