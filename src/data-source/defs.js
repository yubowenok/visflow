/**
 * @fileoverview Visflow data source defs.
 */

/** @inheritDoc */
visflow.DataSource.prototype.NODE_CLASS = 'data-source';

/** @inheritDoc */
visflow.DataSource.prototype.NODE_NAME = 'Data Source';

/** @inheritDoc */
visflow.DataSource.prototype.TEMPLATE = './src/data-source/data-source.html';

/** @inheritDoc */
visflow.DataSource.prototype.PANEL_TEMPLATE =
  './src/data-source/data-source-panel.html';

/** @inheritDoc */
visflow.DataSource.prototype.MIN_HEIGHT = 40;
/** @inheritDoc */
visflow.DataSource.prototype.MAX_HEIGHT = 40;

/** @private @const {number} */
visflow.DataSource.prototype.DEFAULT_NUM_ATTRS_ = 1;

/**
 * Maximum data names length shown in the node.
 * @private {number}
 */
visflow.DataSource.prototype.DATA_NAMES_LENGTH_ = 100;

/** @inheritDoc */
visflow.DataSource.prototype.defaultOptions = function() {
  return {
    // Whether to use data crossing.
    crossing: false,
    // Dimensions used for crossing. -1 is index.
    crossingKeys: [],
    // Name for the attribute column in crossing.
    crossingName: 'attributes',
    // Crossing attributes, in dimension indices.
    crossingAttrs: [],
    // Whether to user server data set in the UI.
    useServerData: true
  };
};
