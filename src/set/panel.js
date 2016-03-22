/**
 * @fileoverview Set panel functions.
 */

/** @inheritDoc */
visflow.Set.prototype.initPanelHeader = function(container) {
  visflow.Set.base.initPanelHeader.call(this, container);
  container.find('.panel-header').find('#vis-mode').hide();
};
