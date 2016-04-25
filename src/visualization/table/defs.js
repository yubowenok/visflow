/**
 * @fileoverview Table defs.
 */

/** @inheritDoc */
visflow.Table.prototype.TEMPLATE = './dist/html/visualization/table/table.html';

/** @inheritDoc */
visflow.Table.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/table/table-panel.html';

/** @inheritDoc */
visflow.Table.prototype.NODE_NAME = 'Table';

/** @inheritDoc */
visflow.Table.prototype.NODE_CLASS = 'table';

/** @inheritDoc */
visflow.Table.prototype.MIN_WIDTH = 400;
/** @inheritDoc */
visflow.Table.prototype.MIN_HEIGHT = 150;

/**
 * The height sum of the DataTable wrapping elements, including
 * - the search box row (35px)
 * - the info row (41px).
 * - horizontal scrollBar (~12px)
 * @private {number}
 */
visflow.Table.prototype.WRAPPER_HEIGHT_ = 35 + 41 + 12;

/**
 * After DataTable is initialized, wait for this amount of time and then resize
 * the table columns. This is to give the columns enough time to recognize the
 * potentially existing vertical scroll bar, so that the columns can get correct
 * widths.
 * @private @const {number}
 */
visflow.Table.prototype.COL_RESIZE_DELAY_ = 10;

/**
 * Maximum number of dimensions by default shown.
 * @private
 */
visflow.Table.prototype.DEFAULT_NUM_DIMENSIONS_ = 20;

/** @inheritDoc */
visflow.Table.prototype.defaultOptions = function() {
  return new visflow.options.Table({
    pageLength: 20,
    propCol: false
  });
};
