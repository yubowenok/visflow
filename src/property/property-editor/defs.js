/**
 * @fileoverview Property editor defs.
 */

/** @inheritDoc */
visflow.PropertyEditor.prototype.NODE_CLASS = 'property-editor';

/** @inheritDoc */
visflow.PropertyEditor.prototype.NODE_NAME = 'Property Editor';

/** @inheritDoc */
visflow.PropertyEditor.prototype.TEMPLATE =
  './src/property/property-editor/property-editor.html';

/** @inheritDoc */
visflow.PropertyEditor.prototype.PANEL_TEMPLATE =
  './src/property/property-editor/property-editor-panel.html';

/** @inheritDoc */
visflow.PropertyEditor.prototype.defaultOptions = function() {
  return {
    color: null,
    border: null,
    width: null,
    size: null,
    opacity: null
  };
};

/**
 * @return {!Array<string>}
 * @private
 */
visflow.PropertyEditor.prototype.properties_ = function() {
  return [
    'color',
    'border',
    'width',
    'size',
    'opacity'
  ];
};

/**
 * @return {!Array<string>}
 * @private
 */
visflow.PropertyEditor.prototype.numericProperties_ = function() {
  return [
    'width',
    'size',
    'opacity'
  ];
};
