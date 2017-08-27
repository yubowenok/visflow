/**
 * @fileoverview Heatmap panel functions.
 */

/** @inheritDoc */
visflow.Heatmap.prototype.initPanel = function(container) {
  visflow.Heatmap.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  this.panelElements = [
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#dims'),
        list: dimensionList,
        selected: this.options.dims,
        listTitle: 'Dimensions',
        addTitle: 'Add Dimension'
      },
      change: function(event, items) {
        this.options.dims = items;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.ColorScaleSelect,
      params: {
        container: container.find('#color-scale'),
        selected: this.options.colorScaleId,
        listTitle: 'Color Scale'
      },
      change: function(event, scaleId) {
        this.options.colorScaleId = scaleId;
        this.itemProps_ = this.getItemProperties_();
        this.show();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#sort-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.sortBy,
        listTitle: 'Sort By'
      },
      change: function(event, dim) {
        this.options.sortBy = dim;
        this.sortItems_();
        this.itemProps_ = this.getItemProperties_();
        this.show();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#label-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.labelBy,
        listTitle: 'Row Labels'
      },
      change: function(event, dim) {
        this.options.labelBy = dim;
        this.itemProps_ = this.getItemProperties_();
        // Label dimension change may lead to leftMargin change.
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#col-label'),
        value: this.options.colLabel,
        title: 'Column Labels'
      },
      change: function(event, value) {
        this.options.colLabel = value;
        this.layoutChanged();
      }
    }
  ];
};
