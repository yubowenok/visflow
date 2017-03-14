/**
 * @fileoverview VisFlow rendering property definitions and modifier node.
 */

/** @const */
visflow.property = {};

/**
 * Properties that can be mapped.
 * @const {!Array<{id: string, text: string}>}
 */
visflow.property.MAPPINGS = [
  {id: 'color', text: 'Color'},
  {id: 'border', text: 'Border'},
  {id: 'size', text: 'Size'},
  {id: 'width', text: 'Width'},
  {id: 'opacity', text: 'Opacity'}
];

/**
 * Acceptable value mapping range.
 * @const {!Object<!Array<number>>}
 */
visflow.property.MAPPING_RANGES = {
  size: [0, 10000],
  width: [0, 10000],
  opacity: [0, 1]
};

/**
 * Scrolling delta for different types of properties.
 * @const {!Object<number>}
 */
visflow.property.SCROLL_DELTAS = {
  size: 0.5,
  width: 0.1,
  opacity: 0.05
};

/**
 * Mapping types for different properties.
 * @const {!Object<string>}
 */
visflow.property.MAPPING_TYPES = {
  color: 'color',
  border: 'color',
  size: 'number',
  width: 'number',
  opacity: 'number'
};

/**
 * Checks if a property is color.
 * @param {string|number} property
 * @return {boolean}
 */
visflow.property.isColorProperty = function(property) {
  return property == 'color' || property == 'border';
};


/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Property = function(params) {
  visflow.Property.base.constructor.call(this, params);
};

_.inherit(visflow.Property, visflow.Node);

/** @inheritDoc */
visflow.Property.prototype.RESIZABLE = false;
/** @protected @const */
visflow.Property.prototype.NO_DATA_STRING = 'No Data';

/**
 * Adjusts the numbers when mapping type has changed.
 * Different mappings have different number ranges.
 * @return {boolean} Whether the numbers are adjusted.
 */
visflow.Property.prototype.adjustNumbers = function() {
  return false;
};

/**
 * Handles interface parameter changes.
 * @param {string} source 'panel' or 'node' or 'external'
 *     'panel': change comes from user interaction in the panel
 *     'node': change comes from user interaction in the node
 *     'external': change comes from external control (e.g. NLP)
 *     We should not redraw the interface underlying user's current changes to
 *     avoid endless loops.
 */
visflow.Property.prototype.parameterChanged = function(source) {};
