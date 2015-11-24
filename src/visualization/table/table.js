/**
 * @fileoverview VisFlow table visualization.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Table = function(params) {
  visflow.Table.base.constructor.call(this, params);

  this.tableState = null; // last table state

  /**
   * Table template. We store a copy of the table structure when the node HTML
   * template is loaded. Because we have to destroy table HTML when input data
   * is updated.
   * @private {jQuery}
   */
  this.tableTemplate_;
};

visflow.utils.inherit(visflow.Table, visflow.Visualization);

/** @inheritDoc */
visflow.Table.prototype.TEMPLATE = './src/visualization/table/table.html';
/** @inheritDoc */
visflow.Table.prototype.PLOT_NAME = 'Table';
/** @inheritDoc */
visflow.Table.prototype.NODE_CLASS = 'table';
/** @inheritDoc */
visflow.Table.prototype.SHAPE_CLASS = 'shape-table';
/** @inheritDoc */
visflow.Table.prototype.MINIMIZED_CLASS = 'table-icon square-icon';


/** @inheritDoc */
visflow.Table.prototype.MIN_WIDTH = 500;
/** @inheritDoc */
visflow.Table.prototype.MIN_HEIGHT = 440;
/**
 * The height sum of the DataTable wrapping elements, including
 * - the search box row (35px)
 * - table scroll head (43px)
 * - the table header row (45px)
 * - the info row (41px).
 * - horizontal scrollBar (~12px)
 * @private {number}
 */
visflow.Table.prototype.WRAPPER_HEIGHT_ = 35 + 43 + 41 + 12;

/**
 * ScrollY value for DataTable.
 * @private {number}
 */
visflow.Table.prototype.SCROLL_Y_ = 300;

/** @inheritDoc */
visflow.Table.prototype.init = function() {
  visflow.Table.base.init.call(this);

  // Store a cloned copy of table structure.
  this.tableTemplate_ = this.content.children('table').clone();
};

/** @inheritDoc */
visflow.Table.prototype.serialize = function() {
  var result = visflow.Table.base.serialize.call(this);
  result.tableState = this.dataTable != null ? this.dataTable.state() : null;
  return result;
};

/** @inheritDoc */
visflow.Table.prototype.deserialize = function(save) {
  visflow.Table.base.deserialize.call(this, save);
  this.tableState = save.tableState;
};

/** @inheritDoc */
visflow.Table.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }

  var pack = this.ports['in'].pack,
      data = pack.data,
      items = pack.items;

  if (this.dataTable) {
    // destroy(true) will remove all table elements, including those from
    // template.
    this.dataTable.destroy(true);
    this.tableTemplate_.clone().appendTo(this.content);
  }

  var rows = [];
  var columns = [
    // Data item index column.
    {title: '#'}
  ].concat(data.dimensions.map(function(dim) {
    return {title: dim};
  }));

  for (var index in items) {
    var row = [index].concat(data.values[index]);
    rows.push(row);
  }

  this.dataTable = this.content.children('table')
    .DataTable({
      stateSave: true,
      data: rows,
      columns: columns,
      scrollX: true,
      pagingType: 'full',
      select: true,
      createdRow: function (row, data, index) {
        if (data[0] in this.selected) {
          $(row).addClass('sel');
        }
      }.bind(this)
    });
  this.dataTable.rows('.sel').select();

  this.updateScrollBodyHeight_();

  this.dataTable
    .on('select.dt', function(event, dt, type, tableIndices) {
      tableIndices.forEach(function(tableIndex) {
        var itemId = rows[tableIndex][0];
        this.selected[itemId] = true;
      }, this);
      this.pushflow();
    }.bind(this))
    .on('deselect.dt', function(event, dt, type, tableIndices) {
      tableIndices.forEach(function(tableIndex) {
        var itemId = rows[tableIndex][0];
        delete this.selected[itemId];
      }, this);
      this.pushflow();
    }.bind(this));
};

/** @inheritDoc */
visflow.Table.prototype.drawBrush = function() {
  // Nothing
};

/**
 * Computes and updates the table scroll body height.
 * @return {number}
 */
visflow.Table.prototype.updateScrollBodyHeight_ = function() {
  var height = this.container.height() - this.WRAPPER_HEIGHT_;
  this.content.find('.dataTables_scrollBody')
    .css('max-height', height)
    .css('height', height);
};

/** @inheritDoc */
visflow.Table.prototype.showSelection = function() {
  // TODO(bowen): Selection is now shown by DataTable select plugin.
  // Check whether this works correctly on data update.
};

/** @inheritDoc */
visflow.Table.prototype.selectAll = function() {
  visflow.Table.base.selectAll.call(this);
};

/** @inheritDoc */
visflow.Table.prototype.clearSelection = function() {
  visflow.Table.base.clearSelection.call(this);
};

/** @inheritDoc */
visflow.Table.prototype.resize = function(size) {
  visflow.Table.base.resize.call(this, size);
  this.updateScrollBodyHeight_();
};

/** @inheritDoc */
visflow.Table.prototype.resizeStop = function(size) {
  visflow.Table.base.resizeStop.call(this, size);
};
