import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import $ from 'jquery';
import L, { Map as LeafletMap, LeafletEvent, LeafletMouseEvent, Circle } from 'leaflet';

import template from './map.html';
import ColumnSelect from '@/components/column-select/column-select';
import {
  Visualization,
  injectVisualizationTemplate,
  drawBrushBox,
  multiplyVisuals,
  getBrushBox,
  isPointInBox,
} from '@/components/visualization';
import { VisualProperties } from '@/data/visuals';
import { SELECTED_COLOR } from '@/common/constants';
import { isNumericalType } from '@/data/util';
import * as history from './history';
import { showSystemMessage } from '@/common/util';

const MAP_ATTRIBUTION = `<a href="http://mapbox.com" target="_blank">© Mapbox</a> |
  <a href="http://openstreetmap.org" target="_blank">© OpenStreetMap</a> |
  <a href="https://www.mapbox.com/map-feedback/#" target="_blank">Improve this map</a>`;
// Mapbox public access token.
const MAP_ACCESS_TOKEN = 'pk.eyJ1IjoieXVib3dlbm9rIiwiYSI6ImNqMGJlMjU0dDAzNmozMm12aHEwbjZ4MDAifQ.sh8WWNXW5eaeWSxkJNZ4TQ';

const LEAFLET_LIGHT_URL = 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=';
const LEAFLET_DARK_URL = 'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=';
const LEAFLET_STREETS_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=';

const ZOOM_EXTENT = [1, 18];
const DEFAULT_ZOOM_LEVEL = 12;
const DEFAULT_CENTER: [number, number] = [40.729, -73.988]; // Around NYC

const DEFAULT_ITEM_VISUALS: VisualProperties = {
  color: '#333',
  border: undefined,
  width: 1.5,
  size: 50,
  opacity: 1,
};

const SELECTED_ITEM_VISUALS: VisualProperties = {
  color: 'white',
  border: SELECTED_COLOR,
};

interface MapSave {
  latitudeColumn: number | null;
  longitudeColumn: number | null;
  isNavigating: boolean;
  center: [number, number]; // map center
  zoom: number; // map zoom level
}

interface MapItemProps {
  index: number;
  lat: number;
  lon: number;
  visuals: VisualProperties;
  hasVisuals: boolean;
  selected: boolean;
}

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColumnSelect,
  },
})
export default class Map extends Visualization {
  protected NODE_TYPE = 'map';

  private latitudeColumn: number | null = null;
  private longitudeColumn: number | null = null;
  private isNavigating = true;
  private zoom = DEFAULT_ZOOM_LEVEL;
  private center: [number, number] = DEFAULT_CENTER;

  private map: LeafletMap | null = null;
  private itemProps: MapItemProps[] = [];
  private circles: { [index: number]: Circle } = {};
  private isMapCreated = false;

  public onKeys(keys: string): boolean {
    if (keys === 'n') {
      this.toggleNavigating();
      return true;
    }
    return this.onKeysVisualization(keys);
  }

  public setLatitudeColumn(column: number) {
    if (!this.isValidColumn(column)) {
      return;
    }
    this.latitudeColumn = column;
    this.draw();
  }

  public setLongitudeColumn(column: number) {
    if (!this.isValidColumn(column)) {
      return;
    }
    this.longitudeColumn = column;
    this.draw();
  }

  public applyColumns(columns: number[]) {
    if (columns.length !== 2) {
      showSystemMessage(this.$store, 'a map visualization needs latitude and longitude columns', 'warn');
      return;
    }
    [this.latitudeColumn, this.longitudeColumn] = columns;
    if (this.hasDataset()) {
      this.draw();
    }
  }

  public setNavigating(value: boolean) {
    this.isNavigating = value;
  }

  /**
   * Finds two numerical columns, preferrably with "lat" and "lon" text in names as latitude and longitude columns.
   */
  protected findDefaultColumns() {
    if (!this.hasDataset()) {
      return;
    }
    const dataset = this.getDataset();
    dataset.getColumns().forEach(column => {
      if (isNumericalType(column.type)) {
        if (column.name.match(/lat/i) !== null) {
          this.latitudeColumn = column.index;
        }
        if (column.name.match(/lon/i) !== null) {
          this.longitudeColumn = column.index;
        }
      }
    });
  }

  protected created() {
    this.serializationChain.push((): MapSave => ({
      isNavigating: this.isNavigating,
      latitudeColumn: this.latitudeColumn,
      longitudeColumn: this.longitudeColumn,
      center: this.center,
      zoom: this.zoom,
    }));
  }

  protected draw() {
    if (this.latitudeColumn === null || this.longitudeColumn === null) {
      this.coverText = 'Please select latitude/longitude columns';
      return;
    }
    this.coverText = '';
    if (!this.isMapCreated) {
      this.isMapCreated = true;
      this.createMap();
    }
    this.computeItemProps();
    this.drawMap();
  }

  protected onResize() {
    if (!this.hasNoDataset() && !this.isAnimating && this.isExpanded) {
      if (this.map) {
        // Leaflet map may not get correct view size upon node creation. Everytime we resize we must invalidate its
        // previous size otherwise only one tile will be rendered.
        this.map.invalidateSize();
      }
    }
  }

  protected isDraggable(evt: MouseEvent, ui?: JQueryUI.DraggableEventUIParams) {
    if (this.isContentVisible && this.isNavigating && !this.isAltPressed) {
      return false; // If the map is in navigation mode, then node drag is disabled.
    }
    return this.isDraggableBase(evt);
  }

  protected isBrushable(): boolean {
    return !this.isNavigating;
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.computeItemProps();
      this.drawMap();
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (!this.isShiftPressed || !brushPoints.length) {
      this.selection.clear(); // reset selection if shift key is not down
      if (!brushPoints.length) {
        return;
      }
    }
    const box = getBrushBox(brushPoints);
    this.itemProps.forEach(props => {
      const point = (this.map as LeafletMap).latLngToContainerPoint([props.lat, props.lon]);
      if (isPointInBox(point, box)) {
        this.selection.addItem(props.index);
      }
    });
  }

  private computeItemProps() {
    const dataset = this.getDataset();
    const pkg = this.inputPortMap.in.getSubsetPackage();

    // Clear the circles that are no longer in the input.
    _.each(this.circles, (circle: Circle, itemIndex: string) => {
      if (!pkg.hasItem(+itemIndex)) {
        circle.removeFrom(this.map as LeafletMap);
        delete this.circles[+itemIndex];
      }
    });

    this.itemProps = pkg.getItems().map(item => {
      const props: MapItemProps = {
        index: item.index,
        lat: dataset.getCellForScale(item.index, this.latitudeColumn as number) as number,
        lon: dataset.getCellForScale(item.index, this.longitudeColumn as number) as number,
        visuals: _.extend({}, DEFAULT_ITEM_VISUALS, item.visuals),
        hasVisuals: !_.isEmpty(item.visuals),
        selected: this.selection.hasItem(item.index),
      };
      if (props.selected) {
        _.extend(props.visuals, SELECTED_ITEM_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  private drawMap() {
    this.drawPoints();
  }

  private drawPoints() {
    const map = this.map as LeafletMap;
    const radiusRatio = Math.pow(2, DEFAULT_ZOOM_LEVEL - map.getZoom());
    this.itemProps.forEach(props => {
      if (!(props.index in this.circles)) {
        this.circles[props.index] = L.circle([0, 0]).addTo(map);
      }
      const circle = this.circles[props.index];
      circle.setLatLng([props.lat, props.lon]);
      circle.setRadius((props.visuals.size as number) * radiusRatio);
      circle.setStyle({
        color: props.visuals.border,
        weight: props.visuals.width,
        fillColor: props.visuals.color,
        opacity: props.visuals.opacity,
        fillOpacity: props.visuals.opacity,
      });
    });
  }

  private createMap() {
    const tileOptions = {
      minZoom: ZOOM_EXTENT[0],
      maxZoom: ZOOM_EXTENT[1],
      accessToken: MAP_ACCESS_TOKEN,
      attribution: MAP_ATTRIBUTION,
    };
    const light = L.tileLayer(LEAFLET_LIGHT_URL + MAP_ACCESS_TOKEN, tileOptions);
    const dark = L.tileLayer(LEAFLET_DARK_URL + MAP_ACCESS_TOKEN, tileOptions);
    const streets = L.tileLayer(LEAFLET_STREETS_URL + MAP_ACCESS_TOKEN, tileOptions);
    this.map = L.map(this.$refs.map as HTMLElement, {
      layers: [light, dark, streets],
    }).setView(this.center, this.zoom);

    // @types/leaflet does not know about attribution
    // tslint:disable-next-line
    (this.map as any).attributionControl.setPrefix('');

    const baseMaps = {
      gray: light,
      dark,
      color: streets,
    };
    L.control.layers(baseMaps).addTo(this.map);

    // Use light layer by default
    $(this.$refs.map).find('.leaflet-control-layers-base input').first().click();

    this.map
      .on('mousedown', (evt: LeafletEvent) => this.onMapMousedown((evt as LeafletMouseEvent).originalEvent))
      .on('mouseup', (evt: LeafletEvent) => this.onMapMouseup((evt as LeafletMouseEvent).originalEvent))
      .on('zoomend', () => {
        this.drawMap();
        this.zoom = (this.map as LeafletMap).getZoom();
        const center = (this.map as LeafletMap).getCenter();
        this.center = [center.lat, center.lng];
      })
      .on('zoomlevelchange', this.drawMap);

    // Invalidates map size after reactive Vue properties are final.
    this.$nextTick(() => (this.map as LeafletMap).invalidateSize());
  }

  private enableZoom() {
    if (!this.map) {
      return;
    }
    this.map.dragging.enable();
    this.map.scrollWheelZoom.enable();
    this.map.boxZoom.enable();
  }

  private disableZoom() {
    if (!this.map) {
      return;
    }
    this.map.dragging.disable();
    this.map.scrollWheelZoom.disable();
    this.map.boxZoom.disable();
  }


  private onMapMousedown(evt: MouseEvent) {
    if (!this.isNavigating) {
      this.disableZoom();
    }
  }

  private onMapMouseup(evt: MouseEvent) {
    if (this.isNavigating) {
      this.enableZoom();
    }
  }

  private toggleNavigating() {
    this.isNavigating = !this.isNavigating;
  }

  private onSelectLatitudeColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectLatitudeColumnEvent(this, column, prevColumn));
    this.setLatitudeColumn(column);
  }

  private onSelectLongitudeColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectLongitudeColumnEvent(this, column, prevColumn));
    this.setLongitudeColumn(column);
  }

  private onToggleNavigating(value: boolean) {
    this.commitHistory(history.toggleNavigatingEvent(this, value));
  }

  private isValidColumn(column: number): boolean {
    if (!this.dataset) {
      return true;
    }
    const columnType = this.dataset.getColumnType(column);
    if (!isNumericalType(columnType)) {
      showSystemMessage(this.$store, `column ${this.dataset.getColumnName(column)} is not a numerical column`, 'warn');
      return false;
    }
    return true;
  }
}
