
"use strict";

var extObject = {

  plotName: "Heatmap",
  iconClass: "dataflow-heatmap-icon dataflow-square-icon",

  // use object to specify default rendering properties
  defaultProperties: {
    "color": "#555",
  },
  // show these properties when items are selected
  selectedProperties: {
    "color": "white",
    "border": "#FF4400",
    "width": 1.5,
  },
  // let d3 know to use attr or style for each key
  isAttr: {
    "id": true
  },
  // translate what user see to css property
  propertyTranslate: {
    "size": "ignore",
    "color": "fill",
    "border": "stroke",
    "width": "stroke-width"
  },

  initialize: function(para) {
    DataflowHeatmap.base.initialize.call(this, para);

    this.prepare();

    // shown dimensions in parallel coordinates
    this.dimensions = [];

    this.scaleTypes = [];
    // index pair (0~n-1, 0~m-1) to screen pixels
    this.screenScales = [];
    // value scale that handles all numerical entries to color
    this.dataScale = [];

    // leave some space for axes
    this.plotMargins = [ { before: 10, after: 10 }, { before: 20, after: 10 } ];
  },

  serialize: function() {
    var result = DataflowHeatmap.base.serialize.call(this);
    result.dimensions = this.dimensions;
    result.colorScale = this.colorScale;
    return result;
  },

  deserialize: function(save) {
    DataflowHeatmap.base.deserialize.call(this, save);

    this.colorScale = save.colorScale;
    this.dimensions = save.dimensions;
    if (this.dimensions == null) {
      console.error("dimensions not saved for " + this.plotName);
      this.dimensions = [];
    }
  },

  prepareInteraction: function() {

    DataflowHeatmap.base.prepareInteraction.call(this);

    var node = this,
        mode = "none";
    var startPos = [0, 0],
        lastPos = [0, 0],
        endPos = [0, 0];
    var selectbox = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0
    };

    var mouseupHandler = function(event) {
      if (mode == "selectbox") {
        node.selectItemsInBox([
            [selectbox.x1, selectbox.x2],
            [selectbox.y1, selectbox.y2]
          ]);
        if (node.selectbox) {
          node.selectbox.remove();
          node.selectbox = null;
        }
      }
      mode = "none";
      if (core.interactionManager.visualizationBlocking)
        event.stopPropagation();
    };

    this.jqsvg
      .mousedown(function(event) {
        if (core.interactionManager.ctrled) // ctrl drag mode blocks
          return;

        startPos = Utils.getOffset(event, $(this));

        if (event.which == 1) { // left click triggers selectbox
          mode = "selectbox";
        }
        if (core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      })
      .mousemove(function(event) {
        if (mode == "selectbox") {
          endPos = Utils.getOffset(event, $(this));
          selectbox.x1 = Math.min(startPos[0], endPos[0]);
          selectbox.x2 = Math.max(startPos[0], endPos[0]);
          selectbox.y1 = Math.min(startPos[1], endPos[1]);
          selectbox.y2 = Math.max(startPos[1], endPos[1]);
          node.showSelectbox(selectbox);
        }
        // we shall not block mousemove (otherwise dragging edge will be problematic)
        // as we can start a drag on edge, but when mouse enters the visualization, drag will hang there
      })
      .mouseup(mouseupHandler)
      .mouseleave(function(event) {
        if ($(this).parent().length == 0) {
          return; // during svg update, the parent of mouseout event is unstable
        }
        mouseupHandler(event);
      });
  },

  selectItemsInBox: function(box) {
    if (!core.interactionManager.shifted) {
      this.selected = {}; // reset selection if shift key is not down
    }

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    for (var i in this.itemIndexes) {
      var index = this.itemIndexes[i];
      var y = this.screenScales[1](i);
      if (y >= box.y1 && y <= box.y2) {
        this.selected[index] = true;
      }
    }

    this.showVisualization();
    this.pushflow();
  },

  showSelectbox: function(box) {
    var node = this;
    this.selectbox = this.svg.select(".df-vis-selectbox");
    if (this.selectbox.empty())
      this.selectbox = this.svg.append("rect")
        .attr("class", "df-vis-selectbox");

    this.selectbox
      .attr("x", this.plotMargins[0].before)
      .attr("y", box.y1)
      .attr("width", this.svgSize[0] - this.plotMargins[0].before - this.plotMargins[0].after)
      .attr("height", box.y2 - box.y1);
  },

  showVisualization: function() {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.checkDataEmpty();
    this.prepareSvg();
    if (this.isEmpty)
      return;
    this.prepareScales();
    this.interaction();

    var node = this;


  /*
    var ritems = []; // data to be rendered
    for (var index in items) {
      var c = [];

      var properties = _.extend(
        {},
        this.defaultProperties,
        items[index].properties,
        {
          id: "i" + index
        }
      );
      if (this.selected[index]) {
        _(properties).extend(this.selectedProperties);
      }
      ritems.push(properties);
    }


    for (var i = 0; i < points.length; i++) {
      var properties = points[i].__data__;
      var u = d3.select(points[i]);

      for (var key in properties) {
        var value = properties[key];
        if (this.propertyTranslate[key] != null)
          key = this.propertyTranslate[key];
        if (key == "ignore")
          continue;
        if (this.isAttr[key] == true)
          u.attr(key, value);
        else
          u.style(key, value);
      }
    }
    */

    this.showSelection();
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;
    // nothing
  },


  showOptions: function() {
    var node = this;

    var dimensionsUpdated = function() {
      node.showVisualization();
      node.process();
      // push dimension change to downflow
      core.dataflowManager.propagate(node);
    };

    this.selectDimensions = DataflowSelect.new({
      id: "dimensions",
      label: "Dimensions",
      multiple: true,
      sortable: true,
      relative: true,
      value: this.dimensions,
      list: this.prepareDimensionList(),
      change: function(event) {
        var unitChange = event.unitChange;
        node.dimensions = unitChange.value;
        node.pushflow();
      }
    });
    this.selectDimensions.jqunit.appendTo(this.jqoptions);


    // a select list of color scales
    this.selectColorScale = DataflowColorScale.new({
      id: "scale",
      label: "Scale",
      value: this.colorScale,
      placeholder: "No Mapping",
      relative: true,
      change: function(event) {
        var unitChange = event.unitChange;
        node.colorScale = unitChange.value;
        node.pushflow();
      }
    });
    this.selectColorScale.jqunit.appendTo(this.jqoptions);
  },

  showAxis: function(d) {
  },

  processExtra: function() {
    // get a sorted list of indexes
    var items = this.ports["in"].pack.items;
    this.itemIndexes = [];
    for (var index in items) {
      this.itemIndexes.push(parseInt(index)); // index is string
    }
    this.itemIndexes.sort();

    // get dataScale
    var scale = this.dataScale = d3.scale.linear();
    for (var index in items) {

    }
  },

  prepareScales: function() {
    [0, 1].map(function(d) {
      this.prepareScreenScale(d);
    }, this);
  },

  prepareScreenScale: function(d) {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;
    var scale = this.screenScales[d] = d3.scale.linear();
    var interval = [this.plotMargins[d].before, this.svgSize[d] - this.plotMargins[d].after];
    if (d) {
      var t = interval[0];
      interval[0] = interval[1];
      interval[1] = t;
    }
    scale.range(interval);
    if (!d){
      scale.domain(d3.range(items.length));
    } else {
      scale.domain(d3.range(this.dimensions.length));
    }
  },

  prepareDimensionList: function(d) {
    var data = this.ports["in"].pack.data,
        dims = data.dimensions,
        dimTypes = data.dimensionTypes;
    var list = [];
    for (var i in dims) {
      if (dimTypes[i] != "string") {
        list.push({
          value: i,
          text: dims[i]
        });
      }
    }
    return list;
  },

  dataChanged: function() {
    var data = this.ports["in"].pack.data;
    // clear dimension selection upon data change
    this.dimensions = [];
    // find all non-string dimensions
    for (var i in data.dimensionTypes) {
      if (data.dimensionTypes[i] != "string") {
        this.dimensions.push(i);
      }
    }
  },

  selectAll: function() {
    DataflowHeatmap.base.selectAll.call(this);
    this.showVisualization();
  },

  clearSelection: function() {
    DataflowHeatmap.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
  },

  resize: function(size) {
    DataflowHeatmap.base.resize.call(this, size);
    [0, 1].map(function(d) {
      this.prepareScreenScale(d);
    }, this);
    this.showVisualization();
  }

};

var DataflowHeatmap = DataflowVisualization.extend(extObject);
