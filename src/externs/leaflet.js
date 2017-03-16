/**
 * @fileoverview Leaflet externs.
 */

/** @const */
var L = {};

/** @const */
L.control = {};

/** @constructor */
var Leaflet = function() {};

/** @constructor */
Leaflet.TileLayer = function() {};

/** @constructor */
Leaflet.Draggable = function() {};

/** @constructor */
Leaflet.Circle = function() {};

/** @constructor */
Leaflet.Control = function() {};

/** @type {!Leaflet.Control} */
Leaflet.prototype.attributionControl;

/**
 * @param {!Object<!Leaflet.TileLayer>} baseLayers
 * @param {!Object<!Leaflet.TileLayer>=} overlays
 * @param {!Object=} options
 * @return {!Leaflet.Control}
 */
L.control.layers = function(baseLayers, overlays, options) {};

/**
 * @param {!Leaflet} map
 */
Leaflet.Control.prototype.addTo = function(map) {};

/**
 * @param {string} mapId
 * @param {Object=} options
 * @return {!Leaflet}
 */
L.map = function(mapId, options) {};

/**
 * @param {!Array<number>} center
 * @param {number} zoom
 */
Leaflet.prototype.setView = function(center, zoom) {};

/**
 * @return {{lat: number, lng: number}}
 */
Leaflet.prototype.getCenter = function() {};

/**
 * @return {number}
 */
Leaflet.prototype.getZoom = function() {};

/**
 * @param {!Array<number>} point
 */
Leaflet.prototype.latLngToContainerPoint = function(point) {};

Leaflet.prototype.invalidateSize = function() {};

/**
 * @param {string} str
 */
Leaflet.Control.prototype.setPrefix = function(str) {};


/** @type {!Leaflet.Draggable} */
Leaflet.prototype.dragging;

Leaflet.Draggable.prototype.enable = function() {};
Leaflet.Draggable.prototype.disable = function() {};

/**
 * @param {string} url
 * @param {Object=} options
 * @return {!Leaflet.TileLayer}
 */
L.tileLayer = function(url, options) {};

/**
 * @param {!Leaflet} map
 */
Leaflet.TileLayer.prototype.addTo = function(map) {};


/**
 * @param {!Array<number>} location
 * @param {Object=} options
 * @return {!Leaflet.Circle}
 */
L.circle = function(location, options) {};

/**
 * @param {!Leaflet} map
 */
Leaflet.Circle.prototype.addTo = function(map) {};

/**
 * @param {number} val
 */
Leaflet.Circle.prototype.setRadius = function(val) {};

/**
 * @param {!Object} style
 */
Leaflet.Circle.prototype.setStyle = function(style) {};

/**
 * @param {!Leaflet} map
 */
Leaflet.Circle.prototype.removeFrom = function(map) {};
