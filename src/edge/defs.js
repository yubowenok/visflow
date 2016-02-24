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

/**
 * Prepares contextMenu for the edge.
 */
visflow.Edge.prototype.contextMenu = function() {
  var contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.contextMenuItems()
  });

  $(contextMenu)
    .on('visflow.delete', this.delete.bind(this));
};
