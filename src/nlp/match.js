/**
 * Gets the chart types supported by VisFlow.
 * @return {!Array<string>}
 * @private
 */
visflow.nlp.chartTypes_ = function() {
  return [
    'scatteplot',
    'parallelCoodrinates',
    'histogram',
    'heatmap',
    'lineChart',
    'network'
  ];
};

/**
 * Matching threshold for the edit distance.
 * Maximum allowed percentage of edit_distance/pattern_length.
 * @private @const {number}
 */
visflow.nlp.MATCH_THRESHOLD_ = .2;

/** @private @const {string} */
visflow.nlp.CHART_TYPE_PLACEHOLDER_ = 'chart_type';

/** @private @const {string} */
visflow.nlp.DIMENSION_PLACEHOLDER_ = 'dim_';

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

/** @private @const {RegExp} */
visflow.nlp.DELIMITER_REGEX_ = /[\s,;.]+/;

/** @private @const {RegExp} */
visflow.nlp.DIMENSION_PLACEHOLDER_REGEX_ = /^dim_\d+$/;

/**
 * Computes the edit distance between input phrase "target" and a known
 * "pattern". target can be word or bigram.
 * Addition/deletion/modification cost = 1.
 * @param {string} target
 * @param {string} pattern
 * @return {boolean} Whether the match succeeded based on allowed edit distance.
 */
visflow.nlp.match = function(target, pattern) {
  target = target.toLowerCase();
  pattern = pattern.toLowerCase(); // case-insensitive matching
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
  if (dp[n][m] <= visflow.nlp.MATCH_THRESHOLD_ * pattern.length) {
    console.log(target, pattern, dp[n][m]);
  }
  return dp[n][m] <= visflow.nlp.MATCH_THRESHOLD_ * pattern.length;
};

/**
 * Replaces chart types in the query by placeholders.
 * Matched chart types are stored in matchedChartTypes_.
 * @param {string} query
 * @return {string}
 * @private
 */
visflow.nlp.matchChartTypes_ = function(query) {
  var chartTypes = visflow.nlp.chartTypes_();
  var chartTypeCounter = 0;
  var tokens = query.split(visflow.nlp.DELIMITER_REGEX_);

  // Match single words
  var parsedTokens = [];
  visflow.nlp.matchedChartTypes_ = {};
  for (var i = 0; i < tokens.length; i++) {
    var matched = false;
    for (var j = 0; j < chartTypes.length; j++) {
      if (visflow.nlp.match(tokens[i], chartTypes[j])) {
        visflow.nlp.matchedChartTypes_[chartTypeCounter++] = chartTypes[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.CHART_TYPE_PLACEHOLDER_);
  }
  // Match bigrams
  tokens = parsedTokens;
  parsedTokens = [];
  for (var i = 0; i < tokens.length - 1; i++) {
    var bigram = tokens[i] + tokens[i + 1];
    var matched = false;
    for (var j = 0; j < chartTypes.length; j++) {
      if (visflow.nlp.match(bigram, chartTypes[j])) {
        visflow.nlp.matchedChartTypes_[chartTypeCounter++] = chartTypes[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.CHART_TYPE_PLACEHOLDER_);
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
 * @private
 */
visflow.nlp.matchDimensions_ = function(query, target) {
  var data = target.getInputData()[0]; // Currently only handles one input data
  var dimensions = data.dimensions;
  var dimensionCounter = 0;
  var tokens = query.split(visflow.nlp.DELIMITER_REGEX_);

  // Match single words
  var parsedTokens = [];
  visflow.nlp.matchedDimensions_ = {};
  for (var i = 0; i < tokens.length; i++) {
    var matched = false;
    for (var j = 0; j < dimensions.length; j++) {
      if (visflow.nlp.match(tokens[i], dimensions[j])) {
        visflow.nlp.matchedDimensions_[visflow.nlp.DIMENSION_PLACEHOLDER_ +
            (++dimensionCounter)] = dimensions[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.DIMENSION_PLACEHOLDER_ + dimensionCounter);
  }
  // Match bigrams
  tokens = parsedTokens;
  parsedTokens = [];
  for (var i = 0; i < tokens.length - 1; i++) {
    var bigram = tokens[i] + tokens[i + 1];
    var matched = false;
    for (var j = 0; j < dimensions.length; j++) {
      if (visflow.nlp.match(bigram, dimensions[j])) {
        visflow.nlp.matchedDimensions_[visflow.nlp.DIMENSION_PLACEHOLDER_ +
            (++dimensionCounter)] = dimensions[j];
        matched = true;
        break;
      }
    }
    parsedTokens.push(!matched ? tokens[i] :
      visflow.nlp.DIMENSION_PLACEHOLDER_ + dimensionCounter);
    if (matched) {
      i++; // Skip the next token if bigram matches.
    } else if (i == tokens.length - 2) { // Last bigram and not matched
      parsedTokens.push(tokens[tokens.length - 1]);
    }
  }
  return parsedTokens.join(' ');
};

/**
 * Maps the chart type placeholders back to the standard chart types.
 * @param {string} command
 * @return {string}
 * @private
 */
visflow.nlp.mapChartTypes_ = function(command) {
  var tokens = command.split(visflow.nlp.DELIMITER_REGEX_);
  var chartTypeCounter = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] == visflow.nlp.CHART_TYPE_PLACEHOLDER_) {
      var chartType = visflow.nlp.matchedChartTypes_[chartTypeCounter++];
      // Unspecified chart_type's will be kept as is.
      // Defaults are chosen during execution.
      tokens[i] = chartType == undefined ? tokens[i] : chartType;
    }
  }
  return tokens.join(' ');
};

/**
 * Maps the dimension placeholders back to the dimension names.
 * @param {string} command
 * @return {string}
 * @private
 */
visflow.nlp.mapDimensions_ = function(command) {
  var tokens = command.split(visflow.nlp.DELIMITER_REGEX_);
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].match(visflow.nlp.DIMENSION_PLACEHOLDER_REGEX_) != null) {
      tokens[i] = visflow.nlp.matchedDimensions_[tokens[i]];
    }
  }
  return tokens.join(' ');
};
