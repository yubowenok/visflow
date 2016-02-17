/**
 * @fileoverview Table panel functions.
 */

/** @inheritDoc */
visflow.Table.prototype.initPanel = function(container) {
  visflow.Table.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var units = [
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#dims'),
        list: dimensionList,
        selected: this.dimensions,
        listTitle: 'Dimensions',
        addTitle: 'Add Dimension'
      },
      change: function(event, items) {
        this.dimensions = items;
        this.dimensionChanged();
      }
    }
  ];
  this.initInterface(units);
};
