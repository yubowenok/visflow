/**
 * @fileoverview Table defs.
 */

/** @inheritDoc */
visflow.Table.prototype.NODE_CLASS = 'table';

/** @inheritDoc */
visflow.Table.prototype.TEMPLATE = './dist/html/visualization/table/table.html';

/** @inheritDoc */
visflow.Table.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/table/table-panel.html';

/** @inheritDoc */
visflow.Table.prototype.MIN_WIDTH = 400;
/** @inheritDoc */
visflow.Table.prototype.MIN_HEIGHT = 150;

/**
 * After DataTable is initialized, wait for this amount of time and then resize
 * the table columns. This is to give the columns enough time to recognize the
 * potentially existing vertical scroll bar, so that the columns can get correct
 * widths.
 * @const {number}
 */
visflow.Table.COL_RESIZE_DELAY = 10;

/**
 * Maximum number of dimensions by default shown.
 * @const {number}
 */
visflow.Table.DEFAULT_NUM_DIMENSIONS = 20;

/** @inheritDoc */
visflow.Table.prototype.defaultOptions = function() {
  return new visflow.options.Table({
    pageLength: 20,
    propCol: false
  });
};
