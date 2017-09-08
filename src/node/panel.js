/**
 * @fileoverview Control panel related functions.
 */


/**
 * @typedef {{
 *   constructor: Function,
 *   params: !Object,
 *   change: function(!jQuery.Event, *),
 *   opening: function(!jQuery.Event, *): *
 * }} params include container, allowClear flag, etc.
 */
visflow.PanelElementSpec;

/**
 * Initializes control panel elements when the panel is loaded.
 * This function should set this.panelElements array with PanelElementSpec's.
 * @param {!jQuery} container Panel container.
 */
visflow.Node.prototype.initPanel = function(container) {};

/**
 * Creates UI elements.
 * @param {!Array<visflow.PanelElementSpec>} uiElements
 */
visflow.Node.prototype.showUiElements = function(uiElements) {
  var preventAltedOpen = function() {
    if (visflow.interaction.isAlted()) {
      // When alt-ed, do not show list.
      return false;
    }
  };
  uiElements.forEach(function(uiElement) {
    _.extend(uiElement.params, {
      opening: preventAltedOpen
    });
    visflow.listen(new uiElement.constructor(uiElement.params),
      visflow.Event.CHANGE, uiElement.change.bind(this));
  }, this);
};

/**
 * Updates the panel when option values changes in the node.
 * @param {!jQuery} container Panel container.
 */
visflow.Node.prototype.updatePanel = function(container) {
  if (!visflow.optionPanel.isOpen) {
    // Do nothing if panel is not open.
    return;
  }
  // Naive simplest update is to redraw.
  this.initPanel(container);
  this.showUiElements(this.panelElements);
};
