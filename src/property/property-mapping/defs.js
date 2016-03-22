/**
 * @fileoverview Property mapping defs.
 */

/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_CLASS = 'property-mapping';

/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_NAME = 'Property Mapping';

/** @inheritDoc */
visflow.PropertyMapping.prototype.TEMPLATE =
  './dist/html/property/property-mapping/property-mapping.html';

/** @inheritDoc */
visflow.PropertyMapping.prototype.PANEL_TEMPLATE =
  './dist/html/property/property-mapping/property-mapping-panel.html';


/** @inheritDoc */
visflow.PropertyMapping.prototype.defaultOptions = function() {
  return new visflow.options.PropertyMapping({
    // Property to be mapped.
    mapping: 'color',
    // Selected color scale.
    colorScaleId: 'redGreen',
    // Mapping range for number type values.
    numberRange: [0, 1]
  });
};
