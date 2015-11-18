/**
 * @fileoverview VisFlow table visualization.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 */
visflow.Table = function(params) {
  visflow.Table.base.constructor.call(this, params);

  this.prepare();
  this.keepSize = null;
  this.tableState = null; // last table state

  this.plotName = 'Table';
};
visflow.utils.inherit(visflow.Table, visflow.Visualization);

/** @inheritDoc */
visflow.Table.prototype.SHAPE_NAME = 'table';
/** @inheritDoc */
visflow.Table.prototype.ICON_CLASS = 'table-icon square-icon';
/** @inheritDoc */
visflow.Table.prototype.contextmenuDisabled = {
  options: true
};

/** @inheritDoc */
visflow.Table.prototype.serialize = function() {
  var result = visflow.Table.base.serialize.call(this);
  result.keepSize = this.keepSize;
  result.tableState = this.table != null ? this.table.state() : null;
  return result;
};

/** @inheritDoc */
visflow.Table.prototype.deserialize = function(save) {
  visflow.Table.base.deserialize.call(this, save);

  this.tableState = save.tableState;
  this.keepSize = save.keepSize;
};

/** @inheritDoc */
visflow.Table.prototype.showVisualization = function() {
  var node = this,
      pack = this.ports['in'].pack,
      data = pack.data,
      items = pack.items;

  this.jqvis.addClass('table');

  this.checkDataEmpty();
  if (this.isEmpty) {
    this.prepareSvg();
    return;
  }

  if (this.table) {
    this.table.destroy(true);
    this.interactionOn = false;
  }

  var rows = [],
      columns = [];
  columns.push({
    title: '#'
  }); // index column
  for (var i in data.dimensions) { // dimensions
    columns.push({
      title: data.dimensions[i]
    });
  }
  for (var index in items) {
    var row = [index].concat(data.values[index]);
    rows.push(row);
  }
  var jqtable = this.jqtable = $('<table></table>')
    .addClass('table table-striped table-bordered')
    .appendTo(this.jqvis);

  this.table = jqtable
      .DataTable({
        stateSave: true,
        data: rows,
        columns: columns,
        scrollX: true,
        scrollY: '300px',
        info: false
      });
  visflow.utils.blendTableHeader(this.jqview);

  // get thead and tbody selection
  var jqtheadr = jqtable.find('thead');
  this.jqtbody = jqtable.find('tbody');

  var jqwrapper = this.jqvis.find('.dataTables_wrapper'),
      paddedHeight = jqwrapper.height() + 10;

  this.jqview
    .css({
      height: paddedHeight
    })
    .resizable({
      maxWidth: Math.max(jqtheadr.width(), 300),
      maxHeight: paddedHeight
    });

  if (this.keepSize != null) {
    // use previous size regardless of how table entries changed
    this.jqview.css(this.keepSize);
  }

  this.showSelection();
  this.interaction();
};

/** @inheritDoc */
visflow.Table.prototype.prepareInteraction = function() {
  //DataflowTable.base.prepareInteraction.call(this);
  var node = this;

  this.jqtbody
    .mousedown(function(event){
      if (visflow.interactionManager.ctrled) // ctrl drag mode blocks
        return;
      // block events from elements below
      if(visflow.interactionManager.visualizationBlocking)
        event.stopPropagation();
    });

  if (!this.ports['in'].pack.isEmpty()){  // avoid selecting 'no data' msg
    this.jqtbody.on('click', 'tr', function () {
      $(this).toggleClass('selected');
      var jqfirstcol = $(this).find('td:first');
      var index = jqfirstcol.text();

      if (node.selected[index])
        delete node.selected[index];
      else
        node.selected[index] = true;

      node.pushflow();
    });
  }

  this.table.on('draw.dt', function() {
    node.showSelection();
  });
};

/** @inheritDoc */
visflow.Table.prototype.showSelection = function() {
  var node = this;
  this.jqtable.find('tr')
    .filter(function() {
      var index = $(this).find('td:first').text();
      return node.selected[index] != null;
    })
    .addClass('selected');
};

/** @inheritDoc */
visflow.Table.prototype.dataChanged = function() {
  // nothing
};

/** @inheritDoc */
visflow.Table.prototype.selectAll = function() {
  visflow.Table.base.selectAll.call(this);
  this.jqtable.find('tbody tr').addClass('selected');
};

/** @inheritDoc */
visflow.Table.prototype.clearSelection = function() {
  visflow.Table.base.clearSelection.call(this);
  this.jqtable.find('tr').removeClass('selected');
};

/** @inheritDoc */
visflow.Table.prototype.resize = function(size) {
  visflow.Table.base.resize.call(this, size);
  this.keepSize = {
    width: this.viewWidth,
    height: this.viewHeight
  };
  //this.showVisualization();
};

/** @inheritDoc */
visflow.Table.prototype.resizestop = function(size) {
  visflow.Table.base.resizestop.call(this, size);
};
