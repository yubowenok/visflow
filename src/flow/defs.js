/**
 * @fileoverview Flow related definitions.
 */

/**
 * Minimum progress percentage to be shown when all propagation sources have
 * been pushed to queue.
 * @const {number}
 */
visflow.Flow.PROPAGATION_PROGRESS_BASE = .25;

/**
 * Mapping from node type to node constructor.
 * @return {!Object<Function>}
 */
visflow.Flow.nodeConstructors = function() {
  return {
    // Subset flow nodes
    dataSource: visflow.DataSource,
    intersect: visflow.Intersect,
    minus: visflow.Minus,
    union: visflow.Union,
    range: visflow.RangeFilter,
    value: visflow.ValueFilter,
    sampler: visflow.Sampler,
    valueExtractor: visflow.ValueExtractor,
    valueMaker: visflow.ValueMaker,
    propertyEditor: visflow.PropertyEditor,
    propertyMapping: visflow.PropertyMapping,
    table: visflow.Table,
    scatterplot: visflow.Scatterplot,
    parallelCoordinates: visflow.ParallelCoordinates,
    histogram: visflow.Histogram,
    lineChart: visflow.LineChart,
    heatmap: visflow.Heatmap,
    network: visflow.Network,
    map: visflow.Map,

    // Computation nodes
    identity: visflow.Identity
  };
};

/**
 * Mapping from obsolete type names to new ones.
 * @return {!Object<string>}
 */
visflow.Flow.obsoleteTypes = function() {
  return {
    bandLimiter: 'sampler',
    contain: 'value'
  };
};

/**
 * Makes standard the node type to be backward compatible.
 * @param {string} type
 * @return {string}
 */
visflow.Flow.standardizeNodeType = function(type) {
  for (var i = 0; i < type.length; i++) {
    if (type[i] == '_') {
      type = type.replace(/_/g, '-');
      visflow.warning('fix old type with underscore');
      break;
    }
  }
  if (type == 'datasrc') {
    type = 'dataSource';
    visflow.warning('fix old type datasrc');
  }
  return type;
};
