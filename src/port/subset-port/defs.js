/**
 * @fileoverview SubsetPort defs.
 */

/** @const {boolean} */
visflow.SubsetPort.prototype.IS_SUBSET_PORT = true;

/**
 * Returns an array of port contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.SubsetPort.prototype.contextMenuItems = function() {
  return [
    {id: visflow.Event.DISCONNECT, text: 'Disconnect',
      icon: 'glyphicon glyphicon-minus-sign'},
    {id: visflow.Event.EXPORT, text: 'Export Data',
      icon: 'glyphicon glyphicon-open'}
    //{id: 'flowSense', text: 'FlowSense',
    //  icon: 'glyphicon glyphicon-comment'}
  ];
};
