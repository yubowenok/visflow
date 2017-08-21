/** @enum {number} */
visflow.nlp.CommandType = {
  CHART: 0,
  CHART_FILTER: 1,
  HIGHLIGHT: 10,
  SELECT: 11,
  FILTER: 20,
  FIND: 21,
  LINK: 31,
  EXTRACT: 32,
  RENDERING_PROPERTY: 41,
  SET: 51,
  LOAD: 61,

  AUTOLAYOUT: 100,
  DELETE: 101,
  UNKNOWN: -1
};

/** @enum {string} */
visflow.nlp.Keyword = {
  CHART_TYPE: 'chart_type',
  DIMENSION: 'dim',
  HIGHLIGHT: 'highlight',
  SELECTION: 'selection',
  SELECT: 'select',
  FILTER: 'filter',
  SAMPLE: 'sample',
  FIND: 'find',
  CONTAIN: 'contain',
  EXTRACT: 'extract',
  LINK: 'link',
  INTERSECT: 'intersect',
  MINUS: 'minus',
  UNION: 'union',
  AUTOLAYOUT: 'autolayout',
  DELETE: 'delete',
  LOAD: 'load',
  NODE: 'node',
  FROM: 'from',
  OF: 'of',
  TO: 'to',
  INDEX: 'index',
  MAX: 'max',
  MIN: 'min',
  RANDOM: 'random',
  PERCENT: 'percent',
  PERCENT_SIGN: '%'
};

/**
 * Gets the chart types names available.
 * @return {!Array<{name: string, value: string}>}
 */
visflow.nlp.chartTypes = function() {
  return [
    {name: 'table', value: 'table'},
    {name: 'list', value: 'table'},
    {name: 'scatterplot', value: 'scatterplot'},
    {name: 'scp', value: 'scatterplot'},
    {name: 'relation', value: 'chart_type'},
    {name: 'correlation', value: 'chart_type'},
    {name: 'parallel coordinates', value: 'parallelCoordinates'},
    {name: 'pcp', value: 'parallelCoordinates'},
    {name: 'histogram', value: 'histogram'},
    {name: 'distribution', value: 'histogram'},
    {name: 'range', value: 'histogram'},
    {name: 'heatmap', value: 'heatmap'},
    {name: 'color map', value: 'heatmap'},
    {name: 'line chart', value: 'lineChart'},
    {name: 'series', value: 'lineChart'},
    {name: 'network', value: 'network'},
    {name: 'topology', value: 'network'},
    {name: 'map', value: 'map'}
  ];
};

/**
 * Gets the primitive chart types supported.
 * @return {!Array<string>}
 */
visflow.nlp.chartPrimitives = function() {
  return _.uniq(visflow.nlp.chartTypes().map(function(chart) {
    return chart.value;
  }));
};

/**
 * Gets the util command names available.
 * @return {!Array<{name: string, value: string}>}
 */
visflow.nlp.utilTypes = function() {
  return [
    // autolayout
    {name: 'autolayout', value: 'autolayout'},
    {name: 'layout', value: 'autolayout'},

    {name: 'delete', value: 'delete'} // TODO(bowen)
  ];
};

/**
 * Gets the primitive util command types.
 * @return {!Array<string>}
 */
visflow.nlp.utilPrimitives = function() {
  return [
    'autolayout',
    'delete'
  ];
};

/**
 * Gets the supported rendering properties list.
 * @return {!Array<string>}
 */
visflow.nlp.renderingPropertyPrimitives = function() {
  return [
    'color',
    'border',
    'width',
    'size',
    'opacity'
  ];
};

/**
 * Default margin used when creating new node.
 * @const {number}
 */
visflow.nlp.DEFAULT_MARGIN = 150;

/** @const {number} */
visflow.nlp.DEFAULT_MARGIN_SMALL = visflow.nlp.DEFAULT_MARGIN / 2;

/** @const {number} */
visflow.nlp.DEFAULT_SAMPLER_NUMBER = 5;

/** @const {string} */
visflow.nlp.DEFAULT_CHART_TYPE_DIM1 = 'histogram';

/** @const {string} */
visflow.nlp.DEFAULT_CHART_TYPE_DIM2 = 'scatterplot';

/** @const {string} */
visflow.nlp.DEFAULT_CHART_TYPE_DIM3 = 'lineChart';

/** @const {string} */
visflow.nlp.DEFAULT_CHART_TYPE_DIMS = 'parallelCoordinates';

/**
 * Maximum value of N for N-gram detection.
 * @const {number}
 */
visflow.nlp.MAX_NGRAM_TOKENS = 10;
