/**
 * @fileoverview Edge defs.
 */

/**
 * Returns the constant array of edge contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.Edge.prototype.contextMenuItems = function() {
  return [
    {
      id: visflow.Event.DELETE,
      text: 'Delete',
      icon: 'glyphicon glyphicon-remove'
    }
  ];
};

/** @protected @const {number} */
visflow.Edge.ARROW_SIZE_PX = 18;

/** @protected @const {number} */
visflow.Edge.ARROW_OFFSET_PX = 6;
