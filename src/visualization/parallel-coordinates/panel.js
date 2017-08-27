/**
 * @fileoverview Parallel coordinates panel functions.
 */

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.initPanel = function(container) {
  visflow.ParallelCoordinates.base.initPanel.call(this, container);
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
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#ticks'),
        value: this.options.ticks,
        title: 'Ticks'
      },
      change: function(event, value) {
        this.options.ticks = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#axis-label'),
        value: this.options.axisLabel,
        title: 'Axis Labels'
      },
      change: function(event, value) {
        this.options.axisLabel = value;
        this.layoutChanged();
      }
    }
  ];
};
