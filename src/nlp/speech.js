/**
 * @fileoverview VisFlow NLP command with annyang speech recognition.
 */

/** @const {string} */
visflow.nlp.SPEECH_BUTTON_SELECTOR = '#mic';

/** @type {boolean} */
visflow.nlp.isSpeaking = false;

/**
 * Initializes speech recognition.
 */
visflow.nlp.initSpeech = function() {
  if (!visflow.nlp.available) {
    // If NLP service is unavailable, we disable the speech mic button.
    $(visflow.nlp.SPEECH_BUTTON_SELECTOR).prop('disabled', 'dissabled');
    return;
  }

  // We are not using annyang's command recognition.
  // All commands are handled via "resultNoMatch" event.
  annyang.init({}, true);

  annyang.addCallback('resultNoMatch', function(recognized) {
    var candidates = recognized.map(function(candidate, index) {
      return {
        index: index,
        query: candidate,
        score: visflow.nlp.scoreSpeech_(candidate)
      };
    }).sort(function(a, b) {
      if (a.score == b.score) {
        return a.index - b.index; // stable sort
      }
      return b.score - a.score;
    });
    for (var i = 0; i < candidates.length; i++) {
      console.log('[speech candidate]',
        candidates[i].query, candidates[i].score);
    }
    visflow.nlp.speech(candidates[0].query);
  });

  $(visflow.nlp.SPEECH_BUTTON_SELECTOR)
    .click(function() {
      visflow.nlp.toggleSpeech();
    });
};

/**
 * Toggles speech listening.
 * @param {boolean=} opt_state
 */
visflow.nlp.toggleSpeech = function(opt_state) {
  var button = $(visflow.nlp.SPEECH_BUTTON_SELECTOR);
  var newState = opt_state !== undefined ? opt_state : !visflow.nlp.isSpeaking;
  if (newState) {
    button.addClass('active');
    annyang.start({autoRestart: true});
    visflow.nlp.isSpeaking = true;
  } else {
    button.removeClass('active');
    annyang.abort();
    visflow.nlp.isSpeaking = false;
  }
  visflow.nlp.toggleSpeakingEffect_(visflow.nlp.isSpeaking);
};

/**
 * Toggles speaking mic icon effect.
 * @param {boolean} state
 * @private
 */
visflow.nlp.toggleSpeakingEffect_ = function(state) {
  var button = $(visflow.nlp.SPEECH_BUTTON_SELECTOR);
  if (state) {
    var darker = function() {
      button.animate({opacity: 1}, lighter);
    };
    var lighter = function() {
      button.animate({opacity: .5}, darker);
    };
    button.animate({opacity: 1}, lighter);
  } else {
    button
      .css('opacity', 1)
      .stop(true);
  }
};

/**
 * Computes the score for an NLP query candidate.
 * NLP commands and data dimensions are known tokens.
 * A token that matches a known token or can be easily corrected to a known
 * token receives a higher score.
 * @param {string} query
 * @return {number}
 * @private
 */
visflow.nlp.scoreSpeech_ = function(query) {
  var target = visflow.nlp.findTarget();
  var tokens = query.toLowerCase().split(/\s+/);

  var chartTypeNames = visflow.nlp.chartTypes()
    .map(function(type) { return type.name; });
  var utilTypeNames = visflow.nlp.utilTypes()
    .map(function(type) { return type.name; });
  var dimensions = target.getDimensionNames();

  var known = _.keySet(chartTypeNames.concat(utilTypeNames).concat(dimensions));
  var score = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] in known) {
      score += 1.0;
    }
  }
  for (var i = 0; i < tokens.length - 1; i++) {
    var bigram = tokens[i] + tokens[i + 1];
    if (bigram in known) {
      score += 1.0;
    }
  }
  return score;
};
