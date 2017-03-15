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
        container: container.find('#transpose'),
        value: this.options.transpose,
        title: 'Transpose'
      },
      change: function(event, value) {
        this.options.transpose = value;
        this.updateTranspose_();
      }
    },
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#transpose-keys'),
        list: dimensionList,
        listTitle: 'Key(s)',
        addTitle: 'Add Dimension',
        selected: this.options.transposeKeys,
        allowClear: false
      },
      change: function(event, dims) {
        this.options.transposeKeys = dims;
        if (this.options.transpose) {
          this.updateTranspose_();
        }
      }
    },
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#transpose-attrs'),
        list: dimensionList,
        listTitle: 'Attributes',
        addTitle: 'Add Attribute',
        selected: this.options.transposeAttrs,
        allowClear: true
      },
      change: function(event, attrs) {
        this.options.transposeAttrs = attrs;
        this.validateTransposeAttributes_();
        if (this.options.transpose) {
          this.updateTranspose_();
        }
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#transpose-name'),
        value: this.options.transposeName,
        title: 'Attribute Column Name'
      },
      change: function(event, value) {
        this.options.transposeName = value;
        if (this.options.transpose) {
          this.updateTranspose_();
        }
      }
    }
  ];
  this.initInterface(units);
  if (!this.options.transpose) {
    container.find('#transpose-section').hide();
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
