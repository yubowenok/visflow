import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import { scaleLinear } from 'd3-scale';

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
import { getScale } from '@/components/visualization';
import { getColorScale } from '@/common/color-scale';

enum VisualEditorMode {
  ASSIGNMENT = 'assignment',
  ENCODING = 'encoding',
}

interface VisualEditorSave {
  mode: VisualEditorMode;
  visuals: VisualProperties;
  encoding: EncodingParams;
}

interface EncodingParams {
  column: number | null;
  type: VisualPropertyType;
  colorScale: {
    id: string;
  };
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

  private mode: VisualEditorMode = VisualEditorMode.ASSIGNMENT;
  private visuals: VisualProperties = {};
  private encoding: EncodingParams = {
    column: null,
    type: VisualPropertyType.COLOR,
    colorScale: { id: 'red-green' },
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
    const width = this.visuals.width ? Math.min(this.visuals.width, this.width / 2) : 0;
    const baseSize = Math.min(this.width, this.height);
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

  protected onDatasetChange() {
    this.encoding.column = null; // Avoid unexpected encoding on new dataset column.
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
    this.removeFalsyVisuals(); // Adding this to the default updateAndPropagate()
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
    this.outputPortMap.out.updatePackage(pkg);
  }

  private dyeAssignment(): SubsetPackage {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const visuals = _.clone(this.visuals) as VisualProperties;
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
    if (this.encoding.column === null || (!this.isNumericalEncoding && !this.encoding.colorScale.id)) {
      return pkg;
    }
    const dataset = this.getDataset();
    if (isNumericalVisual(this.encoding.type)) {
      const scale = getScale(
        dataset.getColumnType(this.encoding.column),
        dataset.getDomain(this.encoding.column, pkg.getItemIndices()),
        [this.encoding.numericalScale.min, this.encoding.numericalScale.max],
      );
      pkg.getItems().forEach(item => {
        const value = dataset.getCell(item, this.encoding.column as number);
        _.extend(item.visuals, { [this.encoding.type]: scale(value) });
      });
    } else {
      const colorScale = getColorScale(this.encoding.colorScale.id);
      // Create a scale that maps dataset values to [0, 1] to be further used by colorScale.
      const scale = getScale(
        dataset.getColumnType(this.encoding.column),
        dataset.getDomain(this.encoding.column, pkg.getItemIndices()),
        [0, 1],
      );
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
  private removeFalsyVisuals() {
    const visuals = this.visuals;
    _.each(visuals, (value: string | number | undefined, prop: string) => {
      if (visuals[prop] === null || visuals[prop] === '') {
        visuals[prop] = undefined;
      }
    });
  }
}
