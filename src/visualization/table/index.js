/**
 * @fileoverview VisFlow table visualization.
 */

/**
 * @param {Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Table = function(params) {
  visflow.Table.base.constructor.call(this, params);
  /** @type {Object} */
  this.tableState = null; // last dataTable state

  /**
   * Table template. We store a copy of the table structure when the node HTML
   * template is loaded. Because we have to destroy table HTML when input data
   * is updated.
   * @private {!jQuery}
   */
  this.tableTemplate_ = $();

  /**
   * Flag indicating the next select/deselect in the table shall be canceled as
   * the interaction is performed as dragging.
   * @private {boolean}
   */
  this.cancelTableSelect_ = false;
};

_.inherit(visflow.Table, visflow.Visualization);


/** @inheritDoc */
visflow.Table.prototype.init = function() {
  visflow.Table.base.init.call(this);

  // Store a cloned copy of table structure.
  this.tableTemplate_ = this.content.children('table').clone();
};

/** @inheritDoc */
visflow.Table.prototype.serialize = function() {
  var result = visflow.Table.base.serialize.call(this);
  result.dimensions = this.options.dims;
  result.tableState = this.dataTable != null ? this.dataTable.state() : null;
  return result;
};

/** @inheritDoc */
visflow.Table.prototype.deserialize = function(save) {
  visflow.Table.base.deserialize.call(this, save);
  this.tableState = save.tableState;
  if (this.options.dims == null) {
    // Deserialize from old-version dimensions.
    // If not possible, then use raw dimensions.
    this.options.dims = save.dimensions || this.findPlotDimensions();
  }
};

/** @inheritDoc */
visflow.Table.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }

  var pack = this.ports['in'].pack;
  var data = pack.data;
  var items = pack.items;

  if (this.dataTable) {
    // destroy(true) will remove all table elements, including those from
    // template.
    this.dataTable.destroy(true);
    this.tableTemplate_.clone().appendTo(this.content);
  }

  var rows = [];
  var columns = [
    // Data item index column.
    {title: ''}
  ].concat(this.options.dims.map(function(dim) {
    return {title: data.dimensions[dim]};
  }));

  for (var index in items) {
    var row = [index];
    this.options.dims.forEach(function(dim) {
      row.push(data.values[index][dim]);
    }, this);
    rows.push(row);
  }

  var columnDefs = [{
    render: function(index) {
      return [
        '<span class="table-prop" style="',
        items[index].properties.color !== undefined ?
          'background-color: ' + items[index].properties.color + ';' : '',
        items[index].properties.border !== undefined ?
          'border: 1px solid ' + items[index].properties.border + ';' : '',
        '"></span>'
      ].join(' ');
    },
    orderable: false,
    targets: 0
  }];
  this.options.dims.forEach(function(dim, dimIndex) {
    if (data.dimensionTypes[dim] == visflow.ValueType.TIME) {
      columnDefs.push({
        render: function(value) {
          return visflow.utils.formatTime(value);
        }.bind(this),
        // +1 for the index column!
        targets: dimIndex + 1
      });
    }
  }, this);

  this.dataTable = this.content.children('table')
    .DataTable({
      data: rows,
      columnDefs: columnDefs,
      stateSave: true,
      columns: columns,
      scrollX: true,
      order: [],
      pagingType: 'full',
      select: true,
      pageLength: this.options.pageLength,
      lengthMenu: [5, 10, 20, 50, 100],
      createdRow: function(row, data) {
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
        }.bind(this), visflow.Table.COL_RESIZE_DELAY);
      }.bind(this),
      infoCallback: function() {
        var this_ = /** @type {!DataTables.Api} */(this);
        var api = this_.api();
        var pageInfo = api.page.info();
        return 'Page ' + (pageInfo.page + 1) + '/' + pageInfo.pages;
      }
    });
  this.dataTable.column(0).visible(this.options.propCol);
  this.dataTable.rows('.sel').select();

  this.updateScrollBodyHeight_();

  var selectHandler = function(event, dt, type, tableIndices) {
    var cancelled = this.toCancelSelect_();
    tableIndices.forEach(function(tableIndex) {
      if (cancelled) {
        return;
      }
      var itemId = rows[tableIndex][0];
      this.selected[itemId] = true;
    }, this);
    if (cancelled) {
      // Cancel undesired dragging select.
      this.dataTable.off('deselect.dt', deselectHandler);
      this.dataTable.rows(tableIndices).deselect();
      this.dataTable.on('deselect.dt', deselectHandler);
    }
    this.pushflow();
  }.bind(this);
  var deselectHandler = function(event, dt, type, tableIndices) {
    var cancelled = this.toCancelSelect_();
    tableIndices.forEach(function(tableIndex) {
      if (cancelled) {
        return;
      }
      var itemId = rows[tableIndex][0];
      delete this.selected[itemId];
    }, this);
    if (cancelled) {
      // Cancel undesired dragging deselect.
      this.dataTable.off('select.dt', selectHandler);
      this.dataTable.rows(tableIndices).select();
      this.dataTable.on('select.dt', selectHandler);
    }
    this.pushflow();
  }.bind(this);

  this.dataTable
    .on('length.dt', function(event, settings, length) {
      this.options.pageLength = length;
    }.bind(this))
    .on('select.dt', selectHandler)
    .on('deselect.dt', deselectHandler);
};

/** @inheritDoc */
visflow.Table.prototype.drawBrush = function() {
  // Nothing
};

/**
 * Computes and updates the table scroll body height.
 * @private
 */
visflow.Table.prototype.updateScrollBodyHeight_ = function() {
  var height = this.container.height() -
    this.container.find('.dataTables_scrollHead').height() -
    visflow.Table.WRAPPER_HEIGHT;
  this.content.find('.dataTables_scrollBody')
    .css('max-height', height)
    .css('height', height);
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
  this.options.dims = this.findPlotDimensions();
};

/**
 * @return {!Array<number>}
 * @override
 */
visflow.Table.prototype.findPlotDimensions = function() {
  return d3.range(this.ports['in'].pack.data.dimensions.length)
    .slice(0, visflow.Table.DEFAULT_NUM_DIMENSIONS);
};

/** @inheritDoc */
visflow.Table.prototype.dimensionChanged = function() {
  // No scale preparation.
  this.show();
};

/** @inheritDoc */
visflow.Table.prototype.resize = function() {
  // Do not call Visualization's resize because it will re-render the scene.
  // For table re-rendering is unnecessary and slow.
  // However we still need to call Visualization.base's (Node) resize because
  // it will save css states and update ports.
  visflow.Visualization.base.resize.call(this);

  this.updateScrollBodyHeight_();
};

/** @inheritDoc */
visflow.Table.prototype.mousedown = function(event) {
  var inTable = $(event.target).closest('.dataTables_scroll').length > 0;
  if (visflow.interaction.isAlted()) {
    // Alt drag mode blocks.
    if (inTable) {
      this.cancelTableSelect_ = true;
    }
    return false;
  }

  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    if (!inTable) {
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

/**
 * Checks if the next select/deselect shall be cancelled. If so clear the flag.
 * @return {boolean}
 * @private
 */
visflow.Table.prototype.toCancelSelect_ = function() {
  if (this.cancelTableSelect_) {
    this.cancelTableSelect_ = false;
    return true;
  }
  return false;
};
