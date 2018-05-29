/**
 * @fileoverview Set defs.
 */

/** @inheritDoc */
visflow.Set.prototype.DEFAULT_LABEL = 'Set';

/** @inheritDoc */
visflow.Set.prototype.RESIZABLE = false;

/** @inheritDoc */
visflow.Set.prototype.PANEL_TEMPLATE = './dist/html/set/set-panel.html';

/** @protected {number} */
visflow.Set.prototype.MAX_LABEL_LENGTH = 9;

/** @inheritDoc */
visflow.Set.prototype.contextMenuItems = function() {
  return [
    {id: visflow.Event.MINIMIZE, text: 'Minimize',
      icon: 'glyphicon glyphicon-resize-small'},
    {id: visflow.Event.PANEL, text: 'Control Panel',
      icon: 'glyphicon glyphicon-th-list'},
    //{id: visflow.Event.FLOWSENSE, text: 'FlowSense',
    //  icon: 'glyphicon glyphicon-comment'},
    {id: visflow.Event.DELETE, text: 'Delete', icon:
      'glyphicon glyphicon-remove'}
  ];
};
