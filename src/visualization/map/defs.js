/**
 * @fileoverview Map defs.
 */

/** @inheritDoc */
visflow.Map.prototype.NODE_CLASS = 'map';

/** @inheritDoc */
visflow.Map.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/map/map-panel.html';

/** @protected @const {string} */
visflow.Map.ATTRIBUTION =
  '<a href="http://mapbox.com" target="_blank">© Mapbox</a> | ' +
  '<a href="http://openstreetmap.org" target="_blank">© OpenStreetMap</a> | ' +
  '<a href="https://www.mapbox.com/map-feedback/#" target="_blank">' +
      'Improve this map</a>';

/** @protected @const {string} */
visflow.Map.LEAFLET_LIGHT_URL =
  'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?' +
  'access_token=';

/** @protected @const {string} */
visflow.Map.LEAFLET_DARK_URL =
  'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?' +
  'access_token=';

/** @protected @const {string} */
visflow.Map.LEAFLET_STREETS_URL =
  'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?' +
  'access_token=';

/** @protected @const {string} */
visflow.Map.ACCESS_TOKEN =
  'pk.eyJ1IjoieXVib3dlbm9rIiwiYSI6ImNqMGJlMjU0dDAzNmozMm12aHEwbjZ4MDAifQ.' +
  'sh8WWNXW5eaeWSxkJNZ4TQ';

/** @protected @const {number} */
visflow.Map.MIN_ZOOM = 1;

/** @protected @const {number} */
visflow.Map.MAX_ZOOM = 18;

/** @protected @const {number} */
visflow.Map.DEFAULT_ZOOM = 12;

/** @inheritDoc */
visflow.Map.prototype.defaultOptions = function() {
  return new visflow.options.Map({
    // Latitude dimension
    latDim: 0,
    // Longituide dimension
    lonDim: 1,
    // Use heatmap
    heatmap: false
  });
};

/** @inheritDoc */
visflow.Map.prototype.defaultProperties = function() {
  return {
    color: '#333',
    border: undefined,
    width: 1.5,
    size: 50,
    opacity: 1
  };
};

/** @inheritDoc */
visflow.Map.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: visflow.const.SELECTED_COLOR
  };
};

/** @inheritDoc */
visflow.Map.prototype.contextMenuItems = function() {
  var baseItems = visflow.Map.base.contextMenuItems();
  return baseItems.concat([
    {
      id: visflow.Event.NAVIGATION,
      text: 'Navigation',
      bind: 'navigation',
      hotKey: 'N'
    }
  ]);
};
