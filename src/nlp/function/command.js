/** @typedef {{token: string, syntax: string}} */
visflow.nlp.CommandToken;

/**
 * Checks if a root command is to highlight.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isHighlight_ = function(token) {
  return token == visflow.nlp.Keyword.HIGHLIGHT;
};

/**
 * Checks if the root command is a util.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isUtil_ = function(token) {
  return visflow.nlp.utilPrimitives().indexOf(token) != -1;
};

/**
 * Checks if a root command is to filter or find.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isFilter_ = function(token) {
  return token == visflow.nlp.Keyword.FILTER ||
    token == visflow.nlp.Keyword.FIND ||
    token == visflow.nlp.Keyword.SAMPLE;
};

/**
 * Checks if a root command is to load data.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isLoad_ = function(token) {
  return token == visflow.nlp.Keyword.LOAD;
};

/**
 * Chekcs if a root command is a rendering property.
 * @param {string} token
 * @return {boolean}
 */
visflow.nlp.isRenderingProperty = function(token) {
  return visflow.nlp.renderingPropertyPrimitives().indexOf(token) != -1;
};


/**
 * Checks if a token is a value (substring) match.
 * @param {string} token
 * @return {boolean}
 */
visflow.nlp.isContain = function(token) {
  return token == visflow.nlp.Keyword.CONTAIN;
};

/**
 * Checks if a token is a value extraction.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isExtract_ = function(token) {
  return token == visflow.nlp.Keyword.EXTRACT;
};

/**
 * Checks if a token is to select.
 * @param {string} token
 * @return {boolean}
 * @private
 */
visflow.nlp.isSelect_ = function(token) {
  return token == visflow.nlp.Keyword.SELECT;
};


/**
 * Gets the filter command type form a token.
 * @param {string} token
 * @return {visflow.nlp.CommandType}
 * @private
 */
visflow.nlp.getFilterType_ = function(token) {
  switch (token) {
    case visflow.nlp.Keyword.LINK:
      return visflow.nlp.CommandType.LINK;
    case visflow.nlp.Keyword.FILTER:
    case visflow.nlp.Keyword.SAMPLE:
      return visflow.nlp.CommandType.FILTER;
    case visflow.nlp.Keyword.FIND:
      return visflow.nlp.CommandType.FIND;
    default:
      return visflow.nlp.CommandType.UNKNOWN;
  }
};

/**
 * Gets the util command type from a token.
 * @param {string} token
 * @return {visflow.nlp.CommandType}
 * @private
 */
visflow.nlp.getUtilType_ = function(token) {
  switch (token) {
    case visflow.nlp.Keyword.AUTOLAYOUT:
      return visflow.nlp.CommandType.AUTOLAYOUT;
    case visflow.nlp.Keyword.DELETE:
      return visflow.nlp.CommandType.DELETE;
    default:
      return visflow.nlp.CommandType.UNKNOWN;
  }
};

/**
 * Checks what type a command is.
 * @param {string} command
 * @return {visflow.nlp.CommandType}
 */
visflow.nlp.getCommandType = function(command) {
  var root = command.split(/\s+/)[0];
  switch (true) {
    case visflow.nlp.isChartType(root):
      return visflow.nlp.CommandType.CHART;
    case visflow.nlp.isHighlight_(root):
      return visflow.nlp.CommandType.HIGHLIGHT;
    case visflow.nlp.isFilter_(root):
      return visflow.nlp.getFilterType_(root);
    case visflow.nlp.isSelect_(root):
      return visflow.nlp.CommandType.SELECT;
    case visflow.nlp.isUtil_(root):
      return visflow.nlp.getUtilType_(root);
    case visflow.nlp.isRenderingProperty(root):
      return visflow.nlp.CommandType.RENDERING_PROPERTY;
    case visflow.nlp.isLoad_(root):
      return visflow.nlp.CommandType.LOAD;
    case visflow.nlp.isExtract_(root):
      return visflow.nlp.CommandType.EXTRACT;
    default:
      return visflow.nlp.CommandType.UNKNOWN;
  }
};
