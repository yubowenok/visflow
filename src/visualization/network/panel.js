/**
 * @fileoverview Network panel functions.
 */

/** @inheritDoc */
visflow.Network.prototype.initPanel = function(container) {
  visflow.Network.base.initPanel.call(this, container);
  var nodeDimensionList = this.getDimensionList();
  var edgeDimensionList = this.getDimensionList(
    this.ports['inEdges'].pack.data);

  this.panelElements = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#node-id-by'),
        list: nodeDimensionList,
        allowClear: false,
        selected: this.options.nodeIdBy,
        listTitle: 'Node Id'
      },
      change: function(event, dim) {
        this.options.nodeIdBy = dim;
        this.inputChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#source-by'),
        list: edgeDimensionList,
        allowClear: false,
        selected: this.options.sourceBy,
        listTitle: 'Edge Source'
      },
      change: function(event, dim) {
        this.options.sourceBy = dim;
        this.inputChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#target-by'),
        list: edgeDimensionList,
        allowClear: false,
        selected: this.options.targetBy,
        listTitle: 'Edge Target'
      },
      change: function(event, dim) {
        this.options.targetBy = dim;
        this.inputChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#label-by'),
        list: nodeDimensionList,
        allowClear: true,
        selected: this.options.labelBy,
        listTitle: 'Label By'
      },
      change: function(event, dim) {
        this.options.labelBy = dim;
        this.inputChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#distance'),
        value: this.options.distance,
        accept: visflow.ValueType.INT,
        range: [1, 1000],
        scrollDelta: 5,
        title: 'Link Distance'
      },
      change: function(event, value) {
        this.options.distance = value;
        this.inputChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#label-node'),
        value: this.options.nodeLabel,
        title: 'Node Label'
      },
      change: function(event, value) {
        this.options.nodeLabel = value;
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#navigation'),
        value: this.options.navigation,
        title: 'Navigation'
      },
      change: function(event, value) {
        this.options.navigation = value;
      }
    }
  ];
};
