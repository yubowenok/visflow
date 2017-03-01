/**
 * @fileoverview Edge defs.
 */

/**
 * Returns the constant array of edge contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.Edge.prototype.contextMenuItems = function() {
  return [
    {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
  ];
};

/** @private @const {number} */
visflow.Edge.prototype.ARROW_SIZE_PX_ = 18;

/** @private @const {number} */
visflow.Edge.prototype.ARROW_OFFSET_PX_ = 6;
