/**
 * @fileoverview Node defs.
 */

/**
 * Node template common template file, containing the popup, background, etc.
 * @protected {string}
 */
visflow.Node.prototype.COMMON_TEMPLATE = './dist/html/node/node.html';

/**
 * Node content template file.
 * @protected {string}
 */
visflow.Node.prototype.TEMPLATE = '';

/**
 * Node control panel common template file, containing the panel header.
 * @protected {string}
 */
visflow.Node.prototype.COMMON_PANEL_TEMPLATE =
  './dist/html/node/node-panel.html';

/**
 * Node control panel template file.
 * @protected {string}
 */
visflow.Node.prototype.PANEL_TEMPLATE = '';

/**
 * Class that defines the node type.
 * @protected {string}
 */
visflow.Node.prototype.NODE_CLASS = '';

/**
 * Node name used for label.
 * @protected {string}
 */
visflow.Node.prototype.DEFAULT_LABEL = 'Node';


// Minimum/maximum size of resizable.
/** @protected {number} */
visflow.Node.prototype.MIN_WIDTH = 120;
/** @protected {number} */
visflow.Node.prototype.MIN_HEIGHT = 60;
/** @protected {number} */
visflow.Node.prototype.MAX_WIDTH = Infinity;
/** @protected {number} */
visflow.Node.prototype.MAX_HEIGHT = Infinity;

/** @protected {number} */
visflow.Node.prototype.MAX_LABEL_LENGTH = 14;

/**
 * Whether the node is resizable.
 * @protected {boolean}
 */
visflow.Node.prototype.RESIZABLE = true;

/** @const {number} */
visflow.Node.prototype.TOOLTIP_DELAY = 500;

/** @const {number} */
visflow.Node.prototype.PORT_HEIGHT = 15;

/** @const {number} */
visflow.Node.prototype.PORT_GAP = 1;

/** @protected @const {number} */
visflow.Node.FOCUS_ALPHA = 2;

/** @protected @const {number} */
visflow.Node.FOCUS_BETA = 5;

/** @protected @const {number} */
visflow.Node.FOCUS_GAMMA = 500;


/**
 * ContextMenu entries.
 * @return {!Array<visflow.contextMenu.Item>}
 * @protected
 */
visflow.Node.prototype.contextMenuItems = function() {
  return [
    {id: 'minimize', text: 'Minimize',
      icon: 'glyphicon glyphicon-resize-small'},
    {id: 'visMode', text: 'Visualization Mode',
      icon: 'glyphicon glyphicon-facetime-video'},
    {id: 'panel', text: 'Control Panel',
      icon: 'glyphicon glyphicon-th-list'},
    //{id: 'flowSense', text: 'FlowSense',
    //  icon: 'glyphicon glyphicon-comment'},
    {id: 'delete', text: 'Delete',
      icon: 'glyphicon glyphicon-remove'}
  ];
};

/**
 * Default options that shall be set by the node.
 * This is specific to a node type that is a leaf in the inheriting tree.
 * The options written here will be checked and filled during de-serialization.
 * If a class is a inner node of an inheriting tree (e.g. Visualization), it
 * needs to define separate options object and fill it during its inheriting
 * de-serialize function.
 * @return {!visflow.options.Node}
 * @protected
 */
visflow.Node.prototype.defaultOptions = function() {
  return new visflow.options.Node({
    minimized: false,
    label: true,
    visMode: false
  });
};
