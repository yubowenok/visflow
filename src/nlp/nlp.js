/**
 * @fileoverview VisFlow SmartFlow NLP extension.
 */

/** @const */
visflow.nlp = {};

/** @type {boolean} */
visflow.nlp.isWaitingForInput = false;

/** @type {boolean} */
visflow.nlp.isProcessing = false;

/** @type {visflow.Node|undefined} */
visflow.nlp.target = null;

/**
 * Initializes NLP events.
 */
visflow.nlp.init = function() {
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
      visflow.nlp.submit();
    }
  });
};

/**
 * Shows an input box for smart flow input.
 * @param {(!visflow.Node|undefined)=} opt_target
 */
visflow.nlp.input = function(opt_target) {
  visflow.nlp.isWaitingForInput = true;
  visflow.contextMenu.hide();

  // If the input is global, search for a proper target.
  visflow.nlp.target = opt_target ? opt_target : visflow.nlp.findTarget_();

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
 * Submits NLP request to the server.
 */
visflow.nlp.submit = function() {
  var textarea = $('#nlp textarea');
  textarea.prop('disabled', 'disabled');
  visflow.nlp.isProcessing = true;

  var query = visflow.nlp.processQuery_(/** @type {string} */(textarea.val()));
  // TODO(bowen): Send query to the server and wait for the response.

  $.post(visflow.url.NLP, {
    query: query
  }).done(function(res) {
      visflow.nlp.parseResponse_(res);
      visflow.nlp.end();
    })
    .fail(function(res) {
      visflow.error('failed to execute SmartFlow:', res.responseText);
    });
};

/**
 * Searches for a NLP target. Currently returns any of the data sources.
 * @return {visflow.Node}
 * @private
 */
visflow.nlp.findTarget_ = function() {
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
  return visflow.flow.dataSources[0];
};

/**
 * Processes the NLP query. Puts in placeholders for chart types and dimensions.
 * Removes stop words.
 * @param {string} query
 * @return {string}
 * @private
 */
visflow.nlp.processQuery_ = function(query) {
  console.log(visflow.nlp.target);
  query = visflow.nlp.matchChartTypes_(query);
  query = visflow.nlp.matchDimensions_(query, /** @type {!visflow.Node} */(
    visflow.nlp.target));
  console.log('matched query:', query);
  return query;
};

/**
 * Parses the NLP response.
 * @param {string} res HTML response of NLP query.
 * @private
 */
visflow.nlp.parseResponse_ = function(res) {
  if (res.match(/0 candidates/) != null) {
    visflow.warning('Sorry, SmartFlow does not understand the query.');
    return;
  }
  var matched = res.match(/Top value \{\n\s*\(string\s*(\S.*\S)\s*\)/);
  if (matched == null) {
    visflow.error('unexpected NLP response');
    return;
  }
  var result = matched[1];
  if (result[0] == '"') {
    result = result.match(/"(.*)"/)[1]; // Remove string quotes
  }

  console.log('response:', result);
  result = visflow.nlp.mapChartTypes_(result);
  result = visflow.nlp.mapDimensions_(result);
  console.log('result', result);
  visflow.nlp.execute_(result);
};

/**
 * Executes an NLP command.
 * @param {string} command
 * @private
 */
visflow.nlp.execute_ = function(command) {

};

/**
 * Ends the NLP input.
 */
visflow.nlp.end = function() {
  $('#nlp').children().remove();
  visflow.backdrop.toggle(false);
  visflow.nlp.isWaitingForInput = false;
};
