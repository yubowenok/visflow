import { Component } from 'vue-property-decorator';
import * as d3lib from 'd3';
import _ from 'lodash';

import ns from '@/store/namespaces';
import template from './script-editor.html';
import { injectNodeTemplate } from '../node';
import AceModal from '../modals/ace-modal/ace-modal';
import { SubsetNode } from '../subset-node';
import TabularDataset, { TabularRows } from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import * as history from './history';
import FormInput from '@/components/form-input/form-input';
import { SubsetInputPort } from '../port';
import { MessageModalOptions } from '@/store/modals/types';

interface ScriptEditorSave {
  code: string;
  isRenderingEnabled: boolean;
  isStateEnabled: boolean;
  isInstructionVisible: boolean;
  transparentBackground: boolean;
  state: object;
  numInputs: number;
  displayTitle: string;
}

const SUCCESS_MESSAGE_DURATION_MS = 3000;

const TYPEDEF_ANNOTATION = `@typedef {{
  columns: string[],
  rows: Array<Array<number | string>>
}} Table`;
const SINGLE_INPUT_ANNOTATION = '@param {Table | undefined} input';
const MULTIPLE_INPUTS_ANNOTATION = '@param {Table[]} input';
const COMMON_ANNOTATION = `@param {HTMLElement | undefined} content
@param {object | undefined} state
@returns {Table}`;

const DEFAULT_CODE = `(input, content, state) => {
  return {
    columns: [],
    rows: [],
  };
};
`;

@Component({
  template: injectNodeTemplate(template),
  components: {
    AceModal,
    FormInput,
  },
})
export default class ScriptEditor extends SubsetNode {
  public isPropagationSource = true;
  public isDataMutated = true;

  protected NODE_TYPE = 'script-editor';
  protected RESIZABLE = true;
  protected HAS_SETTINGS = true;

  @ns.modals.Mutation('openMessageModal') private openMessageModal!: (options: MessageModalOptions) => void;

  // code entered in the editor
  private code = DEFAULT_CODE;

  private displayTitle = '';
  private successMessage = '';
  private executionError = '';
  private warningMessage = '';
  private settingsWarningMessage = '';
  private messageTimeout: NodeJS.Timer | null = null;

  private isInstructionVisible = true;

  private isRenderingEnabled = false;
  private isStateEnabled = false;
  private state = {};
  private transparentBackground = false;
  private numInputs = 1;

  get imgSrc() {
    return require('@/imgs/script-editor.svg');
  }

  get methodAnnotation() {
    let annotation = TYPEDEF_ANNOTATION + '\n';
    annotation += (this.inputPorts.length === 1 ? SINGLE_INPUT_ANNOTATION : MULTIPLE_INPUTS_ANNOTATION) + '\n';
    annotation += COMMON_ANNOTATION;
    return annotation;
  }

  public setCode(code: string) {
    this.code = code;
  }

  public setRenderingEnabled(value: boolean) {
    this.isRenderingEnabled = value;
  }

  public setStateEnabled(value: boolean) {
    this.isStateEnabled = value;
  }

  public setState(state: object) {
    this.state = state;
  }

  public setDisplayTitle(title: string) {
    this.displayTitle = title;
  }

  public setTransparentBackground(value: boolean) {
    this.transparentBackground = value;
    this.backgroundColor = value ? 'none' : 'white';
  }

  protected createInputPorts() {
    this.inputPorts = _.range(this.numInputs)
      .map(index => new SubsetInputPort({
        data: {
          id: 'in' + (index === 0 ? '' : index + 1),
          node: this,
        },
        store: this.$store,
      }));
  }

  protected created() {
    this.serializationChain.push((): ScriptEditorSave => ({
      code: this.code,
      isRenderingEnabled: this.isRenderingEnabled,
      isStateEnabled: this.isStateEnabled,
      isInstructionVisible: this.isInstructionVisible,
      transparentBackground: this.transparentBackground,
      state: this.state,
      numInputs: this.numInputs,
      displayTitle: this.displayTitle,
    }));
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as ScriptEditorSave;
      if (save.transparentBackground) {
        this.setTransparentBackground(true);
      }
    });
  }

  protected update() {
    this.runScript();
  }

  protected runScript() {
    const inputs = this.inputPorts.map(inputPort => {
      const pkg = inputPort.hasPackage() ? (inputPort as SubsetInputPort).getSubsetPackage() : null;
      let inputColumns: string[] | undefined;
      let inputRows: TabularRows | undefined;
      if (pkg && pkg.hasDataset()) {
        const dataset = pkg.getDataset() as TabularDataset;
        inputColumns = dataset.getColumns().map(col => col.name);
        inputRows = dataset.getRows().map(row => row.concat()); // make a copy to avoid changing the original
      }
      return {
        columns: inputColumns,
        rows: inputRows,
      };
    }) || [];

    const input = this.inputPorts.length > 1 ? inputs : inputs[0];
    const code = this.code;
    const renderingContent = this.isRenderingEnabled ? this.$refs.renderingContent : undefined;
    const state = this.isStateEnabled ? this.state : undefined;
    const execute = (
      // tslint:disable-next-line only-arrow-functions
      function() {
        const d3 = d3lib;
        try {
          const method = eval(code); // tslint:disable-line no-eval
          let executeResult: { columns: string[], rows: TabularRows, err?: Error } = {
            columns: [],
            rows: [],
          };
          executeResult = method(input, renderingContent, state);
          return () => executeResult;
        } catch (err) {
          return () => ({ err });
        }
      }
    )();
    const result = execute();
    if (result.err) {
      console.error(result.err);
      this.executionError = result.err.toString();
      return;
    }
    const outputTable = result as { columns: string[], rows: TabularRows };
    this.successMessage = this.warningMessage = this.executionError = '';

    outputTable.rows.forEach(row => {
      if (!(row instanceof Array)) {
        this.executionError = 'output table rows are not all ararys';
        return;
      }
      if (row.length !== outputTable.columns.length) {
        this.executionError = 'output table row length does not match number of columns';
      }
    });

    try {
      this.dataset = outputTable.columns.length ?
        TabularDataset.fromColumnsAndRows(outputTable.columns, outputTable.rows) : null;
      if (!this.dataset) {
        this.updateNoDatasetOutput();
        this.warningMessage = 'output table is empty';
      } else {
        this.updateOutput(new SubsetPackage(this.dataset));
        if (this.isStateEnabled) {
          // When state is enabled, even if the input does not change the script editor would have to propagate.
          // The output may be updated due to state dependency.
          this.propagate();
        }
        this.displaySuccessMessage();
      }
    } catch (parseErr) {
      this.executionError = parseErr.toString();
    }
  }

  protected onResize() {
    if (this.isRenderingEnabled) {
      this.runScript();
    }
  }

  protected onOpenSettingsModal() {
    this.settingsWarningMessage = '';
  }

  private displaySuccessMessage() {
    const dataset = this.getDataset();
    this.successMessage = `success: ${dataset.numColumns()} column(s), ${dataset.numRows()} row(s)`;
    if (this.messageTimeout !== null) {
      clearTimeout(this.messageTimeout);
    }
    this.messageTimeout = setTimeout(() => {
      this.successMessage = '';
      this.messageTimeout = null;
    }, SUCCESS_MESSAGE_DURATION_MS);
  }

  private onCodeChange(code: string, prevCode: string) {
    this.commitHistory(history.editScriptEvent(this, code, prevCode));
    this.setCode(code);
    this.runScript();
    this.propagate();
  }

  private openAceModal() {
    (this.$refs.aceModal as AceModal).open();
  }

  private toggleInstruction() {
    this.isInstructionVisible = !this.isInstructionVisible;
  }

  private onToggleRenderingEnabled(value: boolean) {
    this.commitHistory(history.toggleRenderingEnabledEvent(this, value));
    this.setRenderingEnabled(value);
  }

  private onToggleStateEnabled(value: boolean) {
    this.commitHistory(history.toggleStateEnabledEvent(this, value));
    this.setStateEnabled(value);
  }

  private onToggleTransparentBackground(value: boolean) {
    // TODO: move this to node setting?
    this.setTransparentBackground(value);
  }

  private onInputDisplayTitle(title: string, prevTitle: string) {
    this.commitHistory(history.inputDisplayTitleEvent(this, title, prevTitle));
    this.setDisplayTitle(title);
  }

  private clearState() {
    this.commitHistory(history.clearStateEvent(this, this.state));
    this.setState({});
    this.updateAndPropagate();
  }

  private addInputPort() {
    this.numInputs++;
    const portId = 'in' + (this.inputPorts.length + 1);
    const newPort = new SubsetInputPort({
      data: {
        id: portId,
        node: this,
      },
      store: this.$store,
    });
    this.inputPorts.push(newPort);
    this.onPortsChanged();
  }

  private removeInputPort() {
    const lastInput = this.inputPorts[this.numInputs - 1];
    if (lastInput.isConnected()) {
      this.settingsWarningMessage = 'The last input port has connections. ' +
        'Please disconnect all the connections before removing the port.';
      return;
    }
    this.numInputs--;
    this.inputPorts.pop();
    this.onPortsChanged();
  }
}
