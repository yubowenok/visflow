/**
 * @fileoverview Property mapping defs.
 */

/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_CLASS = 'property-mapping';

/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_NAME = 'Property Mapping';

/** @inheritDoc */
visflow.PropertyMapping.prototype.TEMPLATE =
  './src/property/property-mapping/property-mapping.html';

/** @inheritDoc */
visflow.PropertyMapping.prototype.PANEL_TEMPLATE =
  './src/property/property-mapping/property-mapping-panel.html';


/** @inheritDoc */
visflow.PropertyMapping.prototype.defaultOptions = function() {
  return {
    // Property to be mapped.
    mapping: 'color',
    // Selected color scale.
    colorScaleId: 'redGreen',
    // Mapping range for number type values.
    numberRange: [0, 1]
  };
};
