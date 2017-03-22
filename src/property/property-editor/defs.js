/**
 * @fileoverview Property editor defs.
 */

/** @inheritDoc */
visflow.PropertyEditor.prototype.NODE_CLASS = 'property-editor';

/** @inheritDoc */
visflow.PropertyEditor.prototype.TEMPLATE =
  './dist/html/property/property-editor/property-editor.html';

/** @inheritDoc */
visflow.PropertyEditor.prototype.PANEL_TEMPLATE =
  './dist/html/property/property-editor/property-editor-panel.html';

/** @inheritDoc */
visflow.PropertyEditor.prototype.defaultOptions = function() {
  return new visflow.options.PropertyEditor({
    color: null,
    border: null,
    width: null,
    size: null,
    opacity: null
  });
};

/**
 * @return {!Array<string>}
 * @protected
 */
visflow.PropertyEditor.prototype.properties = function() {
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
 * @protected
 */
visflow.PropertyEditor.prototype.numericProperties = function() {
  return [
    'width',
    'size',
    'opacity'
  ];
};

/**
 * When a property is not set, increase/decrease to this default value.
 * @return {!Object<string, (number|string)>}
 */
visflow.PropertyEditor.prototype.defaultProperties = function() {
  return {
    width: 1,
    size: 1,
    opacity: 1
  };
};
