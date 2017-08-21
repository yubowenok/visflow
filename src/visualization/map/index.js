/**
 * @fileoverview VisFlow map visualization.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Map = function(params) {
  visflow.Map.base.constructor.call(this, params);

  /**
   * Map element container.
   * @type {!jQuery}
   */
  this.mapContainer = $();

  /** @type {?Leaflet} */
  this.map = null;

  /** @type {!Object<number, Leaflet.Circle>} */
  this.circles = {};

  /**
   * Leaflet may only be intialized once.
   * @private {boolean}
   */
  this.initialized_ = false;

  /** @private {!Array<!Object>} */
  this.itemProps_ = [];
};

_.inherit(visflow.Map, visflow.Visualization);


/** @inheritDoc */
visflow.Map.prototype.init = function() {
  visflow.Map.base.init.call(this);

  // We don't need svg for drawing map.
  // But we need it to appear on top of the leaflet map to show selectbox.
  var svg = $(this.svg.node());
  this.mapContainer = $('<div></div>')
    .attr('id', 'map-' + this.id)
    .addClass('leaflet-map')
    .insertBefore(svg);
};

/** @inheritDoc */
visflow.Map.prototype.initContextMenu = function() {
  visflow.Map.base.initContextMenu.call(this);

  $(this.contextMenu)
    .on('vf.navigation', function() {
      this.toggleNavigation_();
    }.bind(this));
};

/** @inheritDoc */
visflow.Map.prototype.serialize = function() {
  var result = visflow.Map.base.serialize.call(this);
  return result;
};

/** @inheritDoc */
visflow.Map.prototype.deserialize = function(save) {
  visflow.Map.base.deserialize.call(this, save);
};

/** @inheritDoc */
visflow.Map.prototype.selectItems = function() {
  this.selectItemsInBox_();
  this.itemProps_ = this.getItemProperties_();
  visflow.Map.base.selectItems.call(this);
};

/**
 * Selects the data points that falls in the selection box.
 * @private
 */
visflow.Map.prototype.selectItemsInBox_ = function() {
  var box = this.getSelectBox(true);
  if (box == null) {
    return;
  }

  if (!visflow.interaction.shifted) {
    // Reset both selected items if shift key is not down.
    this.selected = {};
  }

  // Project
  this.itemProps_.forEach(function(prop) {
    var point = this.map.latLngToContainerPoint([prop.lat, prop.lon]);
    if (visflow.utils.pointInBox(point,
        /** @type {visflow.Rect2Points} */(box))) {
      this.selected[prop.index] = true;
    }
  }, this);
};


/** @inheritDoc */
visflow.Map.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawMap_();
  this.showSelection();
};

/**
 * Creates a leaflet map.
 * @private
 */
visflow.Map.prototype.createMap_ = function() {
  var tileOptions = {
    minZoom: visflow.Map.MIN_ZOOM,
    maxZoom: visflow.Map.MAX_ZOOM,
    accessToken: visflow.Map.ACCESS_TOKEN,
    attribution: visflow.Map.ATTRIBUTION
  };

  var light = L.tileLayer(visflow.Map.LEAFLET_LIGHT_URL +
    visflow.Map.ACCESS_TOKEN, tileOptions);
  var dark = L.tileLayer(visflow.Map.LEAFLET_DARK_URL +
    visflow.Map.ACCESS_TOKEN, tileOptions);
  var streets = L.tileLayer(visflow.Map.LEAFLET_STREETS_URL +
    visflow.Map.ACCESS_TOKEN, tileOptions);

  this.map = L.map(/** @type {string} */(this.mapContainer.attr('id')), {
    layers: [light, dark, streets]
  }).setView(this.options.center, this.options.zoom);
  this.map.attributionControl.setPrefix('');

  var baseMaps = {
    gray: light,
    dark: dark,
    color: streets
  };
  L.control.layers(baseMaps).addTo(this.map);
  this.mapContainer.find('.leaflet-control-layers-base input').first()
      .click(); // Use light layer by default

  this.map.on('mousedown', function(event) {
    this.mousedown(event.originalEvent);
  }.bind(this));

  this.map.on('mouseup', function(event) {
    this.mouseup(event.originalEvent);
  }.bind(this));

  this.map.on('zoomend', function() {
    this.drawMap_();
    this.options.zoom = this.map.getZoom();
    this.options.center = this.map.getCenter();
  }.bind(this));

  this.map.on('zoomlevelschange', function() {
    this.drawMap_();
  }.bind(this));
};

/** @inheritDoc */
visflow.Map.prototype.mousedown = function(event) {
  if (visflow.interaction.isAlted() || !this.options.navigation ||
    this.checkDataEmpty()) {
    // Disable leaflet panning when we are dragging node.
    if (this.map) {
      this.map.dragging.disable();
      this.map.scrollWheelZoom.disable();
      this.map.boxZoom.disable();
    }
    visflow.Map.base.mousedown.call(this, event);
  } else {
    this.container.draggable('disable');
  }
};

/** @inheritDoc */
visflow.Map.prototype.mouseup = function(event) {
  if (!this.options.navigation) {
    visflow.Map.base.mouseup.call(this, event);
    return true;
  }
  this.container.draggable('enable');
  if (this.map) {
    this.map.dragging.enable();
    this.map.scrollWheelZoom.enable();
    this.map.boxZoom.enable();
  }
};

/**
 * Draws the map.
 * @private
 */
visflow.Map.prototype.drawMap_ = function() {
  if (!this.initialized_) {
    this.createMap_();
    this.initialized_ = true;
  }
  this.drawPoints_();
};

/**
 * Renderes the data points.
 * @private
 */
visflow.Map.prototype.drawPoints_ = function() {
  var radiusRatio = Math.pow(2, visflow.Map.DEFAULT_ZOOM - this.map.getZoom());
  this.itemProps_.forEach(function(prop) {
    var circle = this.circles[prop.index];
    if (circle === undefined) {
      circle = L.circle([prop.lat, prop.lon]).addTo(/** @type {!Leaflet} */
        (this.map));
      this.circles[prop.index] = circle;
    }
    circle.setRadius(prop.size * radiusRatio);
    circle.setStyle({
      color: prop.border,
      weight: prop.width,
      fillColor: prop.color,
      fillOpacity: prop.opacity
    });
  }, this);
};

/**
 * Computes the rendering properties for points.
 * @return {!Array}
 * @private
 */
visflow.Map.prototype.getItemProperties_ = function() {
  // Clear circles as input changes.
  _.each(this.circles, function(circle) {
    circle.removeFrom(this.map);
  }.bind(this));
  this.circles = {};

  var inpack = this.ports['in'].pack;
  var values = inpack.data.values;
  var items = inpack.items;
  var itemProps = [];
  for (var itemIndex in items) {
    var index = +itemIndex;
    var prop = _.extend(
      {},
      this.defaultProperties(),
      items[index].properties,
      {
        index: index,
        lat: values[index][this.options.latDim],
        lon: values[index][this.options.lonDim]
      }
    );
    if (!$.isEmptyObject(items[index].properties)) {
      prop.bound = true;
    }
    if (index in this.selected) {
      prop.selected = true;
      _.extend(prop, this.selectedProperties());
      this.multiplyProperties(prop, this.selectedMultiplier());
    }
    itemProps.push(prop);
  }
  return itemProps;
};


/** @inheritDoc */
visflow.Map.prototype.showSelection = function() {
};


/** @inheritDoc */
visflow.Map.prototype.drawBrush = function() {
  this.drawSelectBox();
};

/** @inheritDoc */
visflow.Map.prototype.dataChanged = function() {
  var dims = this.findPlotDimensions();
  this.options.latDim = dims[0];
  this.options.lonDim = dims[1];

  this.selected = {};
};

/** @inheritDoc */
visflow.Map.prototype.dimensionChanged = function() {
  this.itemProps_ = this.getItemProperties_();
  visflow.Map.base.dimensionChanged.call(this);
};

/** @inheritDoc */
visflow.Map.prototype.inputChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};

/** @inheritDoc */
visflow.Map.prototype.selectedChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};

/** @inheritDoc */
visflow.Map.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dims = [];
  var candidates = [];
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] == visflow.ValueType.INT ||
        data.dimensionTypes[dim] == visflow.ValueType.FLOAT) {
      var dimName = data.dimensions[dim];
      if (dimName.match(/lat/i) != null) {
        dims[0] = dim;
      } else if (dimName.match(/lon/i) != null) {
        dims[1] = dim;
      } else {
        candidates.push(dim);
      }
    }
  }
  if (dims[0] == null) {
    dims[0] = _.popFront(candidates);
  }
  if (dims[1] == null) {
    dims[1] = _.popFront(candidates);
  }
  return dims;
};

/** @inheritDoc */
visflow.Map.prototype.setDimensions = function(dims) {
  var data = this.ports['in'].pack.data;
  if (dims.length) {
    this.options.latDim = data.dimensions.indexOf(dims[0]);
  }
  if (dims.length >= 2) {
    this.options.lonDim = data.dimensions.indexOf(dims[1]);
  }
  if (this.options.latDim == null || this.options.lonDim == null) {
    this.findPlotDimensions();
  }
  this.dimensionChanged();
};

/** @inheritDoc */
visflow.Map.prototype.resize = function() {
  visflow.Map.base.resize.call(this);
  if (this.map) {
    this.map.invalidateSize();
  }
};

/** @inheritDoc */
visflow.Map.prototype.keyAction = function(key, event) {
  if (key == 'N') {
    this.toggleNavigation_();
  }
  visflow.Map.base.keyAction.call(this, key, event);
};

/**
 * Toggles the interaction mode between navigation and selection.
 * @param {boolean=} opt_value
 * @private
 */
visflow.Map.prototype.toggleNavigation_ = function(opt_value) {
  this.options.navigation = opt_value !== undefined ? opt_value :
    !this.options.navigation;
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};
