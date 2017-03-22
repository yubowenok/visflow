/**
 * @fileoverview ValueExtractor panel functions.
 */

/** @inheritDoc */
visflow.ValueExtractor.prototype.initPanel = function(container) {
  visflow.ValueExtractor.base.initPanel.call(this, container);
  var units = [
    {
      constructor: visflow.MultipleSelect,
      params: {
        container: container.find('#dims'),
        list: this.getDimensionList(),
        listTitle: 'Dimension(s)',
        selected: this.options.dims,
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dims) {
        if (dims == null) {
          dims = [];
        }
        this.options.dims = dims;
        this.parameterChanged();
      }
    }
  ];
  this.initInterface(units);
};
