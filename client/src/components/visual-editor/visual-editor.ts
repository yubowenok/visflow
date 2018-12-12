import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './visual-editor.html';
import { injectNodeTemplate } from '@/components/node';
import SubsetNode from '@/components/subset-node/subset-node';
import { VisualProperties, VisualPropertyType, isNumericalVisual } from '@/data/visuals';
import { SubsetPackage } from '@/data/package';
import FormSelect from '@/components/form-select/form-select';
import FormInput from '@/components/form-input/form-input';
import ColorInput from '@/components/color-input/color-input';
import ColumnSelect from '@/components/column-select/column-select';
import ColorScaleSelect from '@/components/color-scale-select/color-scale-select';
import ColorScaleDisplay from '@/components/color-scale-display/color-scale-display';
import { getScale, GetScaleOptions, OrdinalScaleType } from '@/components/visualization';
import { getColorScale } from '@/common/color-scale';
import * as history from './history';
import { NODE_CONTENT_PADDING_PX } from '@/common/constants';
import { ValueType } from '@/data/parser';

export enum VisualEditorMode {
  ASSIGNMENT = 'assignment',
  ENCODING = 'encoding',
}

interface NullableVisualProperties {
  color: string | null;
  border: string | null;
  size: number | null;
  width: number | null;
  opacity: number | null;
  [prop: string]: number | string | null;
}

interface VisualEditorSave {
  mode: VisualEditorMode;
  visuals: NullableVisualProperties;
  encoding: EncodingParams;
}

interface EncodingParams {
  column: number | null;
  type: VisualPropertyType;
  colorScaleId: string;
  numericalScale: {
    min: number;
    max: number;
  };
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormSelect,
    ColumnSelect,
    ColorScaleSelect,
    FormInput,
    ColorInput,
    ColorScaleDisplay,
  },
})
export default class VisualEditor extends SubsetNode {
  protected NODE_TYPE = 'visual-editor';
  protected RESIZABLE = true;
  protected DEFAULT_WIDTH = 60;
  protected DEFAULT_HEIGHT = 60;

  private mode: VisualEditorMode = VisualEditorMode.ASSIGNMENT;
  private visuals: NullableVisualProperties = {
    color: null,
    border: null,
    size: null,
    width: null,
    opacity: null,
  };
  private encoding: EncodingParams = {
    column: null,
    type: VisualPropertyType.COLOR,
    colorScaleId: 'red-green' ,
    numericalScale: { min: 1, max: 1 },
  };

  get modeOptions(): SelectOption[] {
    return [
      { label: 'Assignment', value: VisualEditorMode.ASSIGNMENT },
      { label: 'Encoding', value: VisualEditorMode.ENCODING },
    ];
  }

  get encodingTypeOptions(): SelectOption[] {
    return [
      { label: 'Color', value: VisualPropertyType.COLOR },
      { label: 'Border', value: VisualPropertyType.BORDER },
      { label: 'Size', value: VisualPropertyType.SIZE },
      { label: 'Width', value: VisualPropertyType.WIDTH },
      { label: 'Opacity', value: VisualPropertyType.OPACITY },
    ];
  }

  get isNumericalEncoding(): boolean {
    return this.encoding.column !== null && isNumericalVisual(this.encoding.type);
  }

  get displayStyle() {
    let width = this.visuals.width ? Math.min(this.visuals.width, this.width / 2) : 0;
    if (this.visuals.border && width === 0) {
      width = 1; // If the border color is set, show at least 1px of border.
    }
    const baseSize = Math.min(this.width, this.height) - NODE_CONTENT_PADDING_PX * 2;
    const size = this.visuals.size ?
      // If size is defined, we use the defined size.
      Math.min(baseSize, this.visuals.size) :
      // Otherwise we use 75% of node size.
      baseSize * .75;
    return {
      'background-color': this.visuals.color || '',
      'border-color': this.visuals.border || '',
      'border-width': width + 'px',
      'left': (this.width - size) / 2 + 'px',
      'top': (this.height - size) / 2 + 'px',
      'width': size + 'px',
      'height': size + 'px',
      'opacity': this.visuals.opacity || 1,
    };
  }

  public setMode(mode: VisualEditorMode) {
    this.mode = mode;
    this.updateAndPropagate();
  }

  public setVisualsColor(color: string | null) {
    this.visuals.color = color;
    this.updateAndPropagate();
  }

  public setVisualsBorder(border: string | null) {
    this.visuals.border = border;
    this.updateAndPropagate();
  }

  public setVisualsSize(size: number | null) {
    this.visuals.size = size;
    this.updateAndPropagate();
  }

  public setVisualsWidth(width: number | null) {
    this.visuals.width = width;
    this.updateAndPropagate();
  }

  public setVisualsOpacity(opacity: number | null) {
    if (opacity === null) {
      delete this.visuals.opacity;
    } else {
      this.visuals.opacity = opacity;
    }
    this.updateAndPropagate();
  }

  public setEncodingColumn(column: number | null) {
    this.encoding.column = column;
    this.updateAndPropagate();
  }

  public setEncodingType(type: VisualPropertyType) {
    this.encoding.type = type;
    this.updateAndPropagate();
  }

  public setEncodingColorScale(colorScaleId: string) {
    this.encoding.colorScaleId = colorScaleId;
    this.updateAndPropagate();
  }

  public setEncodingScaleMin(value: number | null) {
    this.encoding.numericalScale.min = value || 0;
    this.updateAndPropagate();
  }

  public setEncodingScaleMax(value: number | null) {
    this.encoding.numericalScale.max = value || 0;
    this.updateAndPropagate();
  }

  public getMode(): VisualEditorMode {
    return this.mode;
  }

  public getVisualsAssignment(): NullableVisualProperties {
    return _.clone(this.visuals);
  }

  public getVisualsEncoding(): EncodingParams {
    return _.clone(this.encoding);
  }

  protected onDatasetChange() {
    this.encoding.column = this.updateColumnOnDatasetChange(this.encoding.column);
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.dye();
  }

  protected created() {
    this.serializationChain.push((): VisualEditorSave => ({
      mode: this.mode,
      visuals: this.visuals,
      encoding: this.encoding,
    }));
  }

  protected updateAndPropagate() {
    this.update();
    this.propagate();
  }

  private dye() {
    let pkg: SubsetPackage;
    if (this.mode === VisualEditorMode.ASSIGNMENT) {
      pkg = this.dyeAssignment();
    } else { // VisualEditorMode.ENCODING
      pkg = this.dyeEncoding();
    }
    this.updateOutput(pkg);
  }

  private dyeAssignment(): SubsetPackage {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const visuals = this.removeNullVisuals(this.visuals);
    // Remove undefined to use _.extend later.
    _.each(visuals, (value, prop) => {
      if (visuals[prop] === undefined) {
        delete visuals[prop];
      }
    });
    pkg.getItems().forEach(item => {
      _.extend(item.visuals, visuals);
    });
    return pkg;
  }

  private dyeEncoding(): SubsetPackage {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    if (this.encoding.column === null || (!this.isNumericalEncoding && !this.encoding.colorScaleId)) {
      return pkg;
    }
    const dataset = this.getDataset();
    const itemIndices = pkg.getItemIndices();
    if (isNumericalVisual(this.encoding.type)) {
      const scale = getScale(
        dataset.getColumnType(this.encoding.column),
        dataset.getDomain(this.encoding.column, itemIndices),
        [this.encoding.numericalScale.min, this.encoding.numericalScale.max],
      );
      pkg.getItems().forEach(item => {
        const value = dataset.getCell(item, this.encoding.column as number);
        _.extend(item.visuals, { [this.encoding.type]: scale(value) });
      });
    } else { // color visual
      const colorScale = getColorScale(this.encoding.colorScaleId);
      // Create a scale that maps dataset values to [0, 1] to be further used by colorScale.
      let domain;
      let columnType;
      let range;
      const options: GetScaleOptions = { domainMargin: 0 };
      if (this.encoding.colorScaleId === 'categorical') {
        // When the color scale is categorical, we need to use an ordinal scale that maps all distinct domain values
        // to integers in [0, domain.length).
        columnType = ValueType.STRING;
        domain = dataset.getDomainValues(this.encoding.column, itemIndices, true);
        range = _.range(domain.length);
        options.ordinal = { type: OrdinalScaleType.ORDINAL };
      } else {
        columnType = dataset.getColumnType(this.encoding.column);
        domain = dataset.getDomain(this.encoding.column, itemIndices);
        range = [0, 1];
      }
      const scale = getScale(columnType, domain, range, options);
      pkg.getItems().forEach(item => {
        const value = dataset.getCell(item, this.encoding.column as number);
        const colorScaleValue = scale(value);
        _.extend(item.visuals, { [this.encoding.type]: colorScale(colorScaleValue) });
      });
    }
    return pkg;
  }

  // Reset unset falsy properties to undefined to avoid sending falsy values like
  // color = '' or color = null to the downflow.
  private removeNullVisuals(visuals: NullableVisualProperties): VisualProperties {
    const cleanVisuals: VisualProperties = {};
    _.each(visuals, (value: string | number | null, prop: string) => {
      if (value !== null) {
        cleanVisuals[prop] = value;
      }
    });
    return cleanVisuals;
  }

  private onSelectMode(mode: VisualEditorMode, prevMode: VisualEditorMode) {
    this.commitHistory(history.selectModeEvent(this, mode, prevMode));
    this.setMode(mode);
  }

  private onInputVisualsColor(color: string | null, prevColor: string | null) {
    this.commitHistory(history.inputVisualsColorEvent(this, color, prevColor));
    this.setVisualsColor(color);
  }

  private onInputVisualsBorder(border: string | null, prevBorder: string | null) {
    this.commitHistory(history.inputVisualsBorderEvent(this, border, prevBorder));
    this.setVisualsBorder(border);
  }

  private onInputVisualsSize(size: number | null, prevSize: number | null) {
    this.commitHistory(history.inputVisualsSizeEvent(this, size, prevSize));
    this.setVisualsSize(size);
  }

  private onInputVisualsWidth(width: number | null, prevWidth: number | null) {
    this.commitHistory(history.inputVisualsWidthEvent(this, width, prevWidth));
    this.setVisualsWidth(width);
  }

  private onInputVisualsOpacity(opacity: number | null, prevOpacity: number | null) {
    this.commitHistory(history.inputVisualsOpacityEvent(this, opacity, prevOpacity));
    this.setVisualsOpacity(opacity);
  }

  private onSelectEncodingColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectEncodingColumnEvent(this, column, prevColumn));
    this.setEncodingColumn(column);
  }

  private onSelectEncodingType(type: VisualPropertyType, prevType: VisualPropertyType) {
    this.commitHistory(history.selectEncodingTypeEvent(this, type, prevType));
    this.setEncodingType(type);
  }

  private onSelectEncodingColorScale(colorScaleId: string, prevColorScaleId: string) {
    this.commitHistory(history.selectEncodingColorScaleEvent(this, colorScaleId, prevColorScaleId));
    this.setEncodingColorScale(colorScaleId);
  }

  private onInputEncodingScaleMin(value: number | null, prevValue: number | null) {
    this.commitHistory(history.inputEncodingScaleMinEvent(this, value, prevValue));
    this.setEncodingScaleMin(value);
  }

  private onInputEncodingScaleMax(value: number | null, prevValue: number | null) {
    this.commitHistory(history.inputEncodingScaleMaxEvent(this, value, prevValue));
    this.setEncodingScaleMax(value);
  }
}
