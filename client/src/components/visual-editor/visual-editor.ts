import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './visual-editor.html';
import { injectNodeTemplate } from '@/components/node';
import SubsetNode from '@/components/subset-node/subset-node';
import { VisualProperties, VisualPropertyType } from '@/data/visuals';
import { SubsetPackage } from '@/data/package';
import FormSelect from '@/components/form-select/form-select';
import FormInput from '@/components/form-input/form-input';
import ColorInput from '@/components/color-input/color-input';

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
    FormInput,
    ColorInput,
  },
})
export default class VisualEditor extends SubsetNode {
  protected NODE_TYPE = 'visual-editor';

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
    const dataset = this.getDataset();

    // TODO: add encoding dyeing
    return pkg;
  }

  private dyeAndPropagate() {
    this.removeFalsyVisuals();
    this.update();
    this.portUpdated(this.outputPortMap.out);
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
