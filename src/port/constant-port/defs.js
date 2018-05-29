/**
 * @fileoverview Constant port defs.
 */

/** @const {boolean} */
visflow.ConstantPort.prototype.IS_CONSTANT_PORT = true;

/**
 * Returns an array of port contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.ConstantPort.prototype.contextMenuItems = function() {
  return [
    {id: visflow.Event.DISCONNECT, text: 'Disconnect',
      icon: 'glyphicon glyphicon-minus-sign'},
    //{id: 'flowSense', text: 'FlowSense',
    //  icon: 'glyphicon glyphicon-comment'}
  ];
};
