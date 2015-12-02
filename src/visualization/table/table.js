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
   * Selected dimensions to show in table.
   * @protected {!Array<number>}
   */
  this.dimensions = [];

  /**
   * Table template. We store a copy of the table structure when the node HTML
   * template is loaded. Because we have to destroy table HTML when input data
   * is updated.
   * @private {jQuery}
   */
  this.tableTemplate_;

  _(this.options).extend({
    pageLength: 5
  });
};

visflow.utils.inherit(visflow.Table, visflow.Visualization);

/** @inheritDoc */
visflow.Table.prototype.TEMPLATE = './src/visualization/table/table.html';
/** @inheritDoc */
visflow.Table.prototype.PANEL_TEMPLATE =
    './src/visualization/table/table-panel.html';
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
 * - table scroll head (43px)
 * - the table header row (45px)
 * - the info row (41px).
 * - horizontal scrollBar (~12px)
 * @private {number}
 */
visflow.Table.prototype.WRAPPER_HEIGHT_ = 35 + 43 + 41 + 12;

/**
 * After DataTable is initialized, wait for this amount of time and then resize
 * the table columns. This is to give the columns enough time to recognize the
 * potentially existing vertical scroll bar, so that the columns can get correct
 * widths.
 * @private @const {number}
 */
visflow.Table.prototype.COL_RESIZE_DELAY_ = 10;

/** @inheritDoc */
visflow.Table.prototype.init = function() {
  visflow.Table.base.init.call(this);

  // Store a cloned copy of table structure.
  this.tableTemplate_ = this.content.children('table').clone();
};

/** @inheritDoc */
visflow.Table.prototype.serialize = function() {
  var result = visflow.Table.base.serialize.call(this);
  result.dimensions = this.dimensions;
  result.tableState = this.dataTable != null ? this.dataTable.state() : null;
  return result;
};

/** @inheritDoc */
visflow.Table.prototype.deserialize = function(save) {
  visflow.Table.base.deserialize.call(this, save);
  this.tableState = save.tableState;
  this.dimensions = save.dimensions;
  if (this.dimensions == null) {
    var data = this.ports['in'].pack.data;
    this.dimensions = data.dimensions.concat();
    visflow.warning('table w/o dimensions saved');
  }
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
  ].concat(this.dimensions.map(function(dim) {
    return {title: data.dimensions[dim]};
  }));

  for (var index in items) {
    var row = [index];
    this.dimensions.forEach(function(dim) {
      row.push(data.values[index][dim]);
    }, this);
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
      pageLength: this.options.pageLength,
      lengthMenu: [5, 10, 20, 50],
      createdRow: function (row, data) {
        if (data[0] in this.selected) {
          $(row).addClass('sel');
        }
      }.bind(this),
      initComplete: function() {
        setTimeout(function() {
          var search = this.content.find('.dataTables_filter input');
          // Enter something in the search box to trigger table column resize.
          // Otherwise the width may not be correct due to vertical scroll bar.
          search.val('a').trigger('keyup');
          search.val('').trigger('keyup');
        }.bind(this), this.COL_RESIZE_DELAY_);
      }.bind(this),
      infoCallback: function(settings, start, end, max, total, pre) {
        var api = this.api();
        var pageInfo = api.page.info();
        return 'Page '+ (pageInfo.page + 1) + '/'+ pageInfo.pages;
      }
    });
  this.dataTable.rows('.sel').select();

  this.updateScrollBodyHeight_();

  this.dataTable
    .on('length.dt', function(event, settings, length) {
      this.options.pageLength = length;
    }.bind(this))
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

/** @inheritDoc */
visflow.Table.prototype.initPanel = function(container) {
  visflow.Table.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var list = new visflow.EditableList({
    container: container.find('#dims'),
    list: dimensionList,
    selected: this.dimensions,
    listTitle: 'Dimensions',
    addTitle: 'Add Dimension'
  });
  $(list).on('visflow.change', function(event, items) {
    this.dimensions = items;
    this.dimensionChanged();
  }.bind(this));
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
visflow.Table.prototype.dataChanged = function() {
  visflow.Table.base.dataChanged.call(this);
  // When data set changes, select all dimensions to show in table.
  var data = this.ports['in'].pack.data;
  this.dimensions = d3.range(data.dimensions.length);
};

/** @inheritDoc */
visflow.Table.prototype.dimensionChanged = function() {
  // No scale preparation.
  this.show();
};

/** @inheritDoc */
visflow.Table.prototype.resize = function(size) {
  // Do not call Visualization's resize because it will re-render the scene.
  // For table re-rendering is unnecessary and slow.
  // However we still need to call Visualization.base's (Node) resize because
  // it will save css states and update ports.
  visflow.Visualization.base.resize.call(this, size);

  this.updateScrollBodyHeight_();
};

/** @inheritDoc */
visflow.Table.prototype.mousedown = function(event) {
  if (!visflow.interaction.shifted) {
    visflow.flow.clearNodeSelection();
  }
  visflow.flow.addNodeSelection(this);

  if (visflow.interaction.isPressed(visflow.interaction.keyCodes.ALT)) {
    // Alt drag mode blocks.
    return false;
  }

  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    if ($(event.target).closest('.dataTables_scroll').length == 0) {
      // Dragging is allowed on search header and bottom info.
      return true;
    }
    visflow.Table.base.mousedown.call(this, event);
  }
};

/** @inheritDoc */
visflow.Table.prototype.selectItems = function() {
  // Nothing. Do not pass to parent class. Otherwise show and pushflow will
  // be called and table would have to incorrectly refresh.
};
