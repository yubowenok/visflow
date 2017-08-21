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
        container: container.find('#prop-col'),
        value: this.options.propCol,
        title: 'Property Column'
      },
      change: function(event, value) {
        this.options.propCol = value;
        this.layoutChanged();
      }
    }
  ];
  this.initInterface(units);
};
