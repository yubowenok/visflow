/**
 * @fileoverview Set defs.
 */

/** @inheritDoc */
visflow.Set.prototype.RESIZABLE = false;

/** @inheritDoc */
visflow.Set.prototype.PANEL_TEMPLATE = './dist/html/set/set-panel.html';

/** @protected {number} */
visflow.Set.prototype.MAX_LABEL_LENGTH = 9;

/** @inheritDoc */
visflow.Set.prototype.contextMenuItems = function() {
  return [
    {id: 'minimize', text: 'Minimize',
      icon: 'glyphicon glyphicon-resize-small'},
    {id: 'panel', text: 'Control Panel',
      icon: 'glyphicon glyphicon-th-list'},
    {id: 'flowSense', text: 'FlowSense',
      icon: 'glyphicon glyphicon-comment'},
    {id: 'delete', text: 'Delete', icon:
      'glyphicon glyphicon-remove'}
  ];
};
