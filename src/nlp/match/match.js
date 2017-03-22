
/** @private @const {RegExp} */
visflow.nlp.DELIMITER_REGEX_ = /[\s,;]+/;

/** @private @const {RegExp} */
visflow.nlp.AUTOLAYOUT_REGEX_ = /^.*layout.*$/;

/** @const {string} */
visflow.nlp.DEFAULT_CHART_TYPE = 'scatterplot';


/**
 * Matched chart types in the query string.
 * Key is the chart_type index, value is the matched chart type.
 * @private {!Object<number, string>}
 */
visflow.nlp.matchedChartTypes_ = {};

/**
 * Matched dimension names in the query string.
 * @private {!Object<string>}
 */
visflow.nlp.matchedDimensions_ = {};

/**
 * Matched nodes in the query string.
 * @private {!Object<string>}
 */
visflow.nlp.matchedNodes_ = {};


/**
 * Matching threshold for the edit distance.
 * Maximum allowed percentage of edit_distance/pattern_length.
 * @private @const {number}
 */
visflow.nlp.MATCH_THRESHOLD_ = .2;

/**
 * Stricter matching threshold for the edit distance.
 * @private @const {number}
 */
visflow.nlp.MATCH_THRESHOLD_STRICT_ = .05;


/**
 * Checks if a token is a comparison.
 * @param {string} token
 * @return {boolean}
 */
visflow.nlp.isComparison = function(token) {
  var comparisonTokens = ['<', '>', '=', '<=', '>='];
  return comparisonTokens.indexOf(token) != -1;
};

/**
 * Checks if a rendering property value is a color mapping (a.k.a. a color scale
 * id).
 * @param {string} value
 * @return {boolean}
 */
visflow.nlp.isColorScale = function(value) {
  return visflow.scales.getColorScales().map(function(scale) {
    return scale.id;
  }).indexOf(value) != -1;
};

/**
 * Checks if a root command is a chart type.
 * @param {string} token
 * @return {boolean}
 */
visflow.nlp.isChartType = function(token) {
  return visflow.nlp.chartPrimitives().indexOf(token) != -1 ||
    token == visflow.nlp.Keyword.CHART_TYPE;
};

/**
 * Computes the edit distance between input phrase "target" and a known
 * "pattern". target can be word or bigram.
 * Addition/deletion/modification cost = 1.
 * @param {?string} target
 * @param {string} pattern
 * @param {number=} opt_threshold
 * @return {boolean} Whether the match succeeded based on allowed edit distance.
 */
visflow.nlp.match = function(target, pattern, opt_threshold) {
  if (target == null) {
    return false;
  }

  target = target.toLowerCase();
  pattern = pattern.toLowerCase(); // case-insensitive matching
  var threshold = opt_threshold !== undefined ? opt_threshold :
    visflow.nlp.MATCH_THRESHOLD_;
  var n = target.length;
  var m = pattern.length;
  var dp = [];
  for (var i = 0; i <= n; i++) {
    dp[i] = [];
    for (var j = 0; j <= m; j++) {
      dp[i][j] = Infinity;
    }
  }
  dp[0][0] = 0;
  for (var j = 1; j <= m; j++) {
    dp[0][j] = j;
  }
  for (var i = 1; i <= n; i++) {
    for (var j = 1; j <= m; j++) {
      dp[i][j] = Math.min(dp[i][j - 1], dp[i - 1][j]) + 1;
      if (target[i - 1] == pattern[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i][j], dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[n][m] <= threshold * pattern.length;
};

/**
 * Replaces chart types in the query by placeholders.
 * Matched chart types are stored in matchedChartTypes_.
 * @param {string} query
 * @return {string}
 */
visflow.nlp.matchChartTypes = function(query) {
  var chartTypes = visflow.nlp.chartTypes();
  var chartTypeCounter = 0;
  var tokens = query.split(visflow.nlp.DELIMITER_REGEX_);

  // Match single words
  var parsedTokens = [];
  visflow.nlp.matchedChartTypes_ = {};
  for (var i = 0; i < tokens.length; i++) {
    var matched = false;
    for (var j = 0; j < chartTypes.length; j++) {
      if (visflow.nlp.match(tokens[i], chartTypes[j].name)) {

        // TODO(bowen): Find a better way to handle special utterance
        // ambiguity.
        if (i == 0 && chartTypes[j].value == 'map') {
          // ignore verb map at the beginning
          continue;
        }

        visflow.nlp.matchedChartTypes_[chartTypeCounter++] =
          chartTypes[j].value;
        matched = true;
        break;
      }
      if (tokens[i] == visflow.nlp.Keyword.CHART_TYPE) {
        visflow.nlp.matchedChartTypes_[chartTypeCounter++] =
          visflow.nlp.DEFAULT_CHART_TYPE;
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.Keyword.CHART_TYPE);
  }
  // Match bigrams
  tokens = parsedTokens;
  parsedTokens = [];
  if (tokens.length == 1) {
    parsedTokens.push(tokens[0]);
  }
  for (var i = 0; i < tokens.length - 1; i++) {
    var bigram = tokens[i] + tokens[i + 1];
    var matched = false;
    for (var j = 0; j < chartTypes.length; j++) {
      if (visflow.nlp.match(bigram, chartTypes[j].name)) {
        visflow.nlp.matchedChartTypes_[chartTypeCounter++] =
          chartTypes[j].value;
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.Keyword.CHART_TYPE);
    if (matched) {
      i++; // Skip the next token if bigram matches.
    } else if (i == tokens.length - 2) { // Last bigram and not matched
      parsedTokens.push(tokens[tokens.length - 1]);
    }
  }
  return parsedTokens.join(' ');
};

/**
 * Replaces dimensions in the query by placeholders.
 * Matched dimensions are stored in matchedDimensions_.
 * @param {string} query
 * @param {!visflow.Node} target
 * @return {string}
 */
visflow.nlp.matchDimensions = function(query, target) {
  var dimensions = target.getDimensionNames();
  if (!dimensions.length) {
    dimensions = visflow.flow.getAllDimensionNames();
  }
  var dimensionCounter = 0;
  var tokens = query.split(visflow.nlp.DELIMITER_REGEX_);

  // Match single words
  var parsedTokens = [];
  visflow.nlp.matchedDimensions_ = {};
  for (var i = 0; i < tokens.length; i++) {
    var matched = false;
    for (var j = 0; j < dimensions.length; j++) {
      if (visflow.nlp.match(tokens[i], dimensions[j])) {
        visflow.nlp.matchedDimensions_[dimensionCounter++] = dimensions[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.Keyword.DIMENSION);
  }
  // Match bigrams
  tokens = parsedTokens;
  parsedTokens = [];
  if (tokens.length == 1) {
    parsedTokens.push(tokens[0]);
  }
  for (var i = 0; i < tokens.length - 1; i++) {
    var bigram = tokens[i] + tokens[i + 1];
    var matched = false;
    for (var j = 0; j < dimensions.length; j++) {
      if (visflow.nlp.match(bigram, dimensions[j])) {
        visflow.nlp.matchedDimensions_[dimensionCounter++] = dimensions[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.Keyword.DIMENSION);
    if (matched) {
      i++; // Skip the next token if bigram matches.
    } else if (i == tokens.length - 2) { // Last bigram and not matched
      parsedTokens.push(tokens[tokens.length - 1]);
    }
  }
  return parsedTokens.join(' ');
};

/**
 * Replaces node specifiers by placeholders.
 * Matched nodes are stored in matchedNodes_.
 * @param {string} query
 * @return {string}
 */
visflow.nlp.matchNodes = function(query) {
  var tokens = query.split(visflow.nlp.DELIMITER_REGEX_);
  visflow.nlp.matchedNodes_ = {};

  var nodeCounter = 0;
  var parsedTokens = [];
  var seenFrom = false;
  while (tokens.length) {
    var matchedWord = false;
    var matchedBigram = false;

    // word
    var word = /** @type {string} */(_.first(tokens));
    if (word == visflow.nlp.Keyword.FROM || word == visflow.nlp.Keyword.OF) {
      seenFrom = true;
    }
    if (!seenFrom) {
      // Avoid mapping the first verb to a node label, e.g. "filter the ..."
      // is not "node the ...".
      // TODO(bowen): Move this to grammar content.
      _.popFront(tokens);
      parsedTokens.push(word);
      continue;
    }
    // bigrams
    var bigram = tokens.length >= 2 ? tokens[0] + tokens[1] : null;
    for (var id in visflow.flow.nodes) {
      var node = visflow.flow.nodes[id];
      if (visflow.nlp.match(word, node.label,
          visflow.nlp.MATCH_THRESHOLD_STRICT_)) {
        matchedWord = true;
        visflow.nlp.matchedNodes_[nodeCounter++] = node.label;
        break;
      }
      if (visflow.nlp.match(bigram, node.label,
          visflow.nlp.MATCH_THRESHOLD_STRICT_)) {
        matchedBigram = true;
        visflow.nlp.matchedNodes_[nodeCounter++] = node.label;
        break;
      }
    }

    if (matchedWord || matchedBigram) {
      parsedTokens.push(visflow.nlp.Keyword.NODE);
    } else {
      parsedTokens.push(word);
    }
    _.popFront(tokens);
    if (matchedBigram) {
      _.popFront(tokens);
    }
  }
  return parsedTokens.join(' ');
};

/**
 * Maps the chart type placeholders back to the standard chart types.
 * @param {string} command
 * @return {string}
 */
visflow.nlp.mapChartTypes = function(command) {
  var tokens = command.split(visflow.nlp.DELIMITER_REGEX_);
  var chartTypeCounter = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] == visflow.nlp.Keyword.CHART_TYPE) {
      var chartType = visflow.nlp.matchedChartTypes_[chartTypeCounter++];
      // Unspecified chart_type's will be replaced by default.
      tokens[i] = chartType == undefined ?
        visflow.nlp.DEFAULT_CHART_TYPE : chartType;
    }
  }
  return tokens.join(' ');
};

/**
 * Maps the dimension placeholders back to the dimension names.
 * @param {string} command
 * @return {string}
 */
visflow.nlp.mapDimensions = function(command) {
  var tokens = command.split(visflow.nlp.DELIMITER_REGEX_);
  var dimensionCounter = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] == visflow.nlp.Keyword.DIMENSION) {
      tokens[i] = visflow.nlp.matchedDimensions_[dimensionCounter++];
    }
  }
  return tokens.join(' ');
};

/**
 * Maps the node placeholders back to the node labels.
 * @param {string} commands
 * @return {string}
 */
visflow.nlp.mapNodes = function(commands) {
  var tokens = commands.split(visflow.nlp.DELIMITER_REGEX_);
  var nodeCounter = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] == visflow.nlp.Keyword.NODE) {
      tokens[i] = visflow.nlp.matchedNodes_[nodeCounter++];
    }
  }
  return tokens.join(' ');
};

/**
 * Finds a node matching the conditions.
 * @param {{
 *   label: (string|undefined)
 * }} condition
 * @return {?visflow.Node}
 */
visflow.nlp.findNode = function(condition) {
  for (var id in visflow.flow.nodes) {
    var node = visflow.flow.nodes[id];
    if (condition.label !== undefined && node.label != condition.label) {
      continue;
    }
    // Found a node satisfying all conditions.
    return node;
  }
  return null;
};
