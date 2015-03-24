
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
    "width": "1.5px",
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
    // value scale that handles all numerical entries
    this.valueScale = [];

    // leave some space for axes
    this.plotMargins = [ { before: 30, after: 30 }, { before: 20, after: 20 } ];
  },

  serialize: function() {
    var result = DataflowHeatmap.base.serialize.call(this);
    result.dimensions = this.dimensions;
    return result;
  },

  deserialize: function(save) {
    DataflowHeatmap.base.deserialize.call(this, save);

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
      .attr("x", box.x1)
      .attr("y", box.y1)
      .attr("width", box.x2 - box.x1)
      .attr("height", box.y2 - box.y1);
  },

  showVisualization: function(useTransition) {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.checkDataEmpty();
    this.prepareSvg(useTransition);
    if (this.isEmpty)
      return;
    this.prepareScales();
    this.interaction();

    var node = this;

    if (!useTransition) {
      this.svgPoints = this.svg.append("g");
    }

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

    var points;
    if (!useTransition) {
      points = this.svgPoints.selectAll("circle").data(ritems, function(e) {
        return e.id;
      }).enter()
        .append("circle")[0];
    }
    else {
      points = this.svgPoints.selectAll("circle").data(ritems, function(e) {
        return e.id;
      })[0];
    }

    for (var i = 0; i < points.length; i++) {
      var properties = points[i].__data__;
      var u = d3.select(points[i]);
      if (useTransition)
        u = u.interrupt().transition();

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

    this.showSelection();
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;
    // change position of tag to make them appear on top
    for (var index in this.selected) {
      var jqu = this.jqsvg.find("#i" + index)
        .appendTo($(this.svgPoints[0]));
    }
  },


  showOptions: function() {
    var node = this;
    var div = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Dimensions")
      .appendTo(div);

    var dimensionsUpdated = function() {
      node.showVisualization();
      node.process();
      // push dimension change to downflow
      core.dataflowManager.propagate(node);
    };

    this.selectDimension = $("<select></select>")
      .attr("multiple", "multiple")
      .addClass("dataflow-options-select-multiple")
      .appendTo(div)
      .select2()
      .on("select2-selecting", function(event){
        var dim = event.val;
        for (var i in node.dimensions) {
          if (node.dimensions[i] == dim)
            return; // already selected, skip
        }
        node.dimensions.push(dim);
        dimensionsUpdated();
      })
      .on("select2-removed", function(event){
        var dim = event.val;
        for (var i in node.dimensions) {
          if (node.dimensions[i] == dim) {
            node.dimensions.splice(i, 1); // remove this dimension
          }
        }
        dimensionsUpdated();
      });

    this.selectDimension.parent().find(".select2-choices")
      .sortable({
        update: function(event, ui) {
          node.dimensions = [];
          node.dimensionSelect.parent().find(".select2-search-choice")
            .each(function() {
              var dimName = $(this).children("div").text(); // get dimension name inside tags
              node.dimensions.push(node.dimensionIndexes[dimName]);
            });
          dimensionsUpdated();
        }
      });

    this.prepareDimensionList();
    // show current selection, must call after prepareDimensionList
    this.selectDimension.select2("val", this.dimensions);


    // a select list of color scales
    this.selectColorScale = DataflowColorScale.new({
      id: "scale",
      label: "Scale",
      value: this.colorScale,
      placeholder: "No Mapping",
      relative: true,
      change: function(event) {
        //console.log("change map")
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
    var items = this.ports["in"].pack.items;
    this.itemIndexes = [];
    for (var index in items) {
      this.itemIndexes.push(parseInt(index)); // index is string
    }
    this.itemIndexes.sort();
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
    var dims = this.ports["in"].pack.data.dimensions;
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.selectDimension);
    }
  },

  dataChanged: function() {
    var data = this.ports["in"].pack.data;
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
