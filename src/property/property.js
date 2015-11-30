/**
 * @fileoverview VisFlow rendering property definitions and modifier node.
 */

/** @const */
visflow.property = {};

/**
 * Properties that can be mapped.
 * @protected @const {!Array<{id: string, text: string}>}
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
 * @protected @const {!Object<!Array<number>>}
 */
visflow.property.MAPPING_RANGES = {
  size: [0, 10000],
  width: [0, 10000],
  opacity: [0, 1]
};

/**
 * Scrolling delta for different types of properties.
 * @protected @const {!Object<number>}
 */
visflow.property.SCROLL_DELTAS = {
  size: 0.5,
  width: 0.1,
  opacity: 0.05
};

/**
 * Mapping types for different properties.
 * @protected @const {!Object<string>}
 */
visflow.property.MAPPING_TYPES = {
  color: 'color',
  border: 'color',
  size: 'number',
  width: 'number',
  opacity: 'number'
};

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Property = function(params) {
  visflow.Property.base.constructor.call(this, params);
};

visflow.utils.inherit(visflow.Property, visflow.Node);

/** @inheritDoc */
visflow.Property.prototype.RESIZABLE = false;

/**
 * Adjusts the numbers when mapping type has changed.
 * Different mappings have different number ranges.
 * @return {boolean} Whether the numbers are adjusted.
 * @private
 */
visflow.Property.prototype.adjustNumbers = function() {};

/**
 * Handles input changes.
 * @param {string} source 'panel' or 'node', denoting where the user changes the
 *     input. We should not redraw the interface underlying user's current
 *     changes.
 */
visflow.Property.prototype.inputChanged = function(source) {};