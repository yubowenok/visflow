import { Component } from 'vue-property-decorator';

import template from './script-editor.html';
import { injectNodeTemplate } from '../node';
import AceModal from '../modals/ace-modal/ace-modal';
import { SubsetNode } from '../subset-node';
import TabularDataset, { TabularRows } from '@/data/tabular-dataset';
import { generateCsv, parseCsv } from '@/data/parser';
import { SubsetPackage } from '@/data/package';

interface ScriptEditorSave {
  code: string;
  isInstructionVisible: boolean;
}

const SUCCESS_MESSAGE_DURATION_MS = 3000;

const METHOD_ANNOTATION = `@param {string[] | undefined} columns
@param {Array<Array<number | string>> | undefined} rows
@returns {{
  columns: string[],
  rows: Array<Array<number | string>>
}}`;

const DEFAULT_CODE = `(columns, rows) => {
  return {
    columns: columns || [],
    rows: [],
  };
}
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

  private METHOD_ANNOTATION = METHOD_ANNOTATION;

  // code entered in the editor
  private code = DEFAULT_CODE;

  private successMessage = '';
  private executionError = '';
  private messageTimeout: NodeJS.Timer | null = null;

  private isInstructionVisible = true;
  private toPropagate = false;

  get imgSrc() {
    return require('@/imgs/script-editor.svg');
  }

  protected created() {
    this.serializationChain.push((): ScriptEditorSave => ({
      code: this.code,
      isInstructionVisible: this.isInstructionVisible,
    }));
    this.deserializationChain.push(nodeSave => {
      if (this.lastDatasetHash !== '') {
        this.toPropagate = true;
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
    const execute = (
      // tslint:disable-next-line only-arrow-functions
      function() {
        try {
          const method = eval(code); // tslint:disable-line no-eval
          let executeResult: { columns: string[], rows: TabularRows, err?: Error } = {
            columns: [],
            rows: [],
          };
          executeResult = method(inputColumns, inputRows);
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
    this.successMessage = this.executionError = '';

    try {
      this.dataset = outputTable.columns.length ? parseCsv(generateCsv(outputTable.columns, outputTable.rows)) : null;
      if (!this.dataset) {
        this.updateNoDatasetOutput();
        this.executionError = 'output table has no columns';
      } else {
        console.log(this.dataset);
        this.outputPortMap.out.updatePackage(new SubsetPackage(this.dataset));
        this.displaySuccessMessage();
      }
    } catch (parseErr) {
      this.executionError = parseErr.toString();
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
}
