import { Component } from 'vue-property-decorator';
import * as d3lib from 'd3';

import template from './script-editor.html';
import { injectNodeTemplate } from '../node';
import AceModal from '../modals/ace-modal/ace-modal';
import { SubsetNode } from '../subset-node';
import TabularDataset, { TabularRows } from '@/data/tabular-dataset';
import { generateCsv, parseCsv } from '@/data/parser';
import { SubsetPackage } from '@/data/package';

interface ScriptEditorSave {
  code: string;
  isRenderingEnabled: boolean;
  isInstructionVisible: boolean;
  transparentBackground: boolean;
}

const SUCCESS_MESSAGE_DURATION_MS = 3000;

const METHOD_ANNOTATION = `@param {string[] | undefined} columns
@param {Array<Array<number | string>> | undefined} rows
@param {HTMLElement | undefined} content
@returns {{
  columns: string[],
  rows: Array<Array<number | string>>
}}`;

const DEFAULT_CODE = `(columns, rows, content) => {
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
  },
})
export default class ScriptEditor extends SubsetNode {
  public isPropagationSource = true;

  protected NODE_TYPE = 'script-editor';
  protected RESIZABLE = true;

  private METHOD_ANNOTATION = METHOD_ANNOTATION;

  // code entered in the editor
  private code = DEFAULT_CODE;

  private successMessage = '';
  private executionError = '';
  private warningMessage = '';
  private messageTimeout: NodeJS.Timer | null = null;

  private isInstructionVisible = true;

  private isRenderingEnabled = false;
  private transparentBackground = false;

  get imgSrc() {
    return require('@/imgs/script-editor.svg');
  }

  public setRenderingEnabled(value: boolean) {
    this.isRenderingEnabled = value;
  }

  public setTransparentBackground(value: boolean) {
    this.transparentBackground = value;
    this.backgroundColor = value ? 'none' : 'white';
  }

  protected created() {
    this.serializationChain.push((): ScriptEditorSave => ({
      code: this.code,
      isRenderingEnabled: this.isRenderingEnabled,
      isInstructionVisible: this.isInstructionVisible,
      transparentBackground: this.transparentBackground,
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
    const inputPort = this.inputPortMap.in;
    const pkg = inputPort.hasPackage() ? inputPort.getSubsetPackage() : null;
    let inputColumns: string[] | undefined;
    let inputRows: TabularRows | undefined;
    if (pkg && pkg.hasDataset()) {
      const dataset = pkg.getDataset() as TabularDataset;
      inputColumns = dataset.getColumns().map(col => col.name);
      inputRows = dataset.getRows().map(row => row.concat()); // make a copy to avoid changing the original
    }
    const code = this.code;
    const renderingContent = this.isRenderingEnabled ? this.$refs.renderingContent : undefined;
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
          executeResult = method(inputColumns, inputRows, renderingContent);
          return () => executeResult;
        } catch (err) {
          return () => ({ err });
        }
      }
    )();
    const result = execute();
    if (result.err) {
      this.executionError = result.err.toString();
      return;
    }
    const outputTable = result as { columns: string[], rows: TabularRows };
    this.successMessage = this.warningMessage = this.executionError = '';

    try {
      this.dataset = outputTable.columns.length ? parseCsv(generateCsv(outputTable.columns, outputTable.rows)) : null;
      if (!this.dataset) {
        this.updateNoDatasetOutput();
        this.warningMessage = 'output table is empty';
      } else {
        this.outputPortMap.out.updatePackage(new SubsetPackage(this.dataset));
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

  private displaySuccessMessage() {
    const dataset = this.dataset as TabularDataset;
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
    // TODO: prepare undo redo
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
    this.setRenderingEnabled(value);

  }

  private onToggleTransparentBackground(value: boolean) {
    this.setTransparentBackground(value);
  }
}
