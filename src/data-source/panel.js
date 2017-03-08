/**
 * @fileoverview DataSource panel functions.
 */

/** @inheritDoc */
visflow.DataSource.prototype.initPanel = function(container) {
  container.find('#add-data').click(this.loadDataDialog.bind(this));
  container.find('#clear-data').click(this.clearData.bind(this));

  this.createPanelDataList(container);

  var dimensionList = this.rawData[0] != null ?
    this.getDimensionList(this.rawData[0], true) : [];

  var units = [
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#crossing'),
        value: this.options.crossing,
        title: 'Crossing'
      },
      change: function(event, value) {
        this.options.crossing = value;
        this.updateCrossing_();
      }
    },
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#crossing-keys'),
        list: dimensionList,
        listTitle: 'Key(s)',
        addTitle: 'Add Dimension',
        selected: this.options.crossingKeys,
        allowClear: false
      },
      change: function(event, dims) {
        this.options.crossingKeys = dims;
        if (this.options.crossing) {
          this.updateCrossing_();
        }
      }
    },
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#crossing-attrs'),
        list: dimensionList,
        listTitle: 'Attributes',
        addTitle: 'Add Attribute',
        selected: this.options.crossingAttrs,
        allowClear: true
      },
      change: function(event, attrs) {
        this.options.crossingAttrs = attrs;
        this.validateCrossingAttributes_();
        if (this.options.crossing) {
          this.updateCrossing_();
        }
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#crossing-name'),
        value: this.options.crossingName,
        title: 'Attribute Column Name'
      },
      change: function(event, value) {
        this.options.crossingName = value;
        if (this.options.crossing) {
          this.updateCrossing_();
        }
      }
    }
  ];
  this.initInterface(units);
  if (!this.options.crossing) {
    container.find('#crossing-section').hide();
  }
};


/**
 * Creates a data list in the panel according to the currently loaded data.
 * @param {!jQuery} container
 */
visflow.DataSource.prototype.createPanelDataList = function(container) {
  var ul = container.find('#data-list ul');
  var template = container.find('#data-template');
  ul.children('li').remove();

  var hasData = false;
  this.rawData.forEach(function(rawData, dataIndex) {
    if (rawData == null) {
      return;
    }
    hasData = true;

    var li = template.clone()
      .show()
      .appendTo(ul);
    li.children('.close').click(function() {
      this.deleteData(dataIndex);
      li.remove();
    }.bind(this));

    var data = this.data[dataIndex];
    var text = data.isServerData ?
    data.name + ' (' + data.file + ') ' : data.file + ' (online)';
    li.children('span').text(text);
  }, this);

  if (hasData) {
    container.find('#no-data').hide();
  } else {
    container.find('#no-data').show();
  }
};
