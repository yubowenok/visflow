/**
 * @fileoverview Property mapping panel functions.
 */

/** @inheritDoc */
visflow.PropertyMapping.prototype.initPanel = function(container) {
  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#dim'),
        list: this.getDimensionList(),
        selected: this.options.dim,
        listTitle: 'Dimension',
        selectTitle: this.ports['in'].pack.data.isEmpty() ?
          this.NO_DATA_STRING : null
      },
      change: function(event, dim) {
        this.options.dim = dim;
        this.parameterChanged('panel');
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#mapping'),
        list: visflow.property.MAPPINGS,
        selected: this.options.mapping,
        listTitle: 'Mapping'
      },
      change: function(event, mapping) {
        this.options.mapping = mapping;
        this.showEditableScale(container.find('#scale'), 'panel');
        this.parameterChanged('panel');
      }
    }
  ];
  this.initInterface(units);

  this.showEditableScale(container.find('#scale'), 'panel');
};
