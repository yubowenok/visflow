import { Vue, Component, Watch } from 'vue-property-decorator';
import { Annyang } from 'annyang';
import annyang from 'annyang';

import ns from '@/store/namespaces';
import FormInput from '@/components/form-input/form-input';
import { DatasetInfo } from '@/store/dataset/types';
import TabularDataset from '@/data/tabular-dataset';
import { NodeType } from '@/store/dataflow/types';
import { showSystemMessage, areRangesIntersected } from '@/common/util';

const DROPDOWN_MARGIN_PX = 10;

enum FlowsenseTokenCategory {
  NONE = 'none', // no identifiable category
  DATASET = 'dataset',
  COLUMN = 'column',
  NODE_TYPE = 'node-type',
  NODE_LABEL = 'node-label',
}

interface DropdownElement {
  text: string;
  annotation: string; // additional description of the entry, such as the dataset name a column belongs to
  class: string;
  onClick: () => void;
}

interface ManualCategory {
  startIndex: number;
  endIndex: number; // exclusive on the last character
  chosenCategory: number;
}

interface FlowsenseToken {
  index: number; // The start index of the token as it appears in the whole input text
  text: string;
  chosenCategory: number; // -1 is category not yet checked
  categories: Array<{
    displayText?: string;
    annotation?: string;
    value: string[];
    category: FlowsenseTokenCategory;
  }>;
  manuallySet: boolean;
  isPhrase: boolean; // Is a token in a multi-gram phrase (not at the first position)
}

/**
 * Checks if a character is a separator, i.e. if it is a space or punctuation.
 */
const isSeparator = (char: string): boolean => {
  return char.match(/^[\s,.;?!]$/) !== null;
};

/**
 * Computes the edit distance between input phrase "target" and a known "pattern". Target can be word or multi-gram.
 * Addition/deletion/modification cost = 1.
 */
const matchToken = (target: string, pattern: string, threshold?: number): boolean => {
  if (target == null) {
    return false;
  }
  target = target.toLowerCase();
  pattern = pattern.toLowerCase(); // case-insensitive matching
  threshold = threshold === undefined ? 0 : threshold;
  const n = target.length;
  const m = pattern.length;
  const dp: number[][] = [];
  for (let i = 0; i <= n; i++) {
    dp[i] = [];
    for (let j = 0; j <= m; j++) {
      dp[i][j] = Infinity;
    }
  }
  dp[0][0] = 0;
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const costi = isSeparator(target[i - 1]) ? 0 : 1;
      const costj = isSeparator(pattern[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(dp[i][j - 1] + costj, dp[i - 1][j] + costi);
      if (target[i - 1] === pattern[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i][j], dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[n][m] <= threshold * pattern.length;
};


@Component({
  components: {
    FormInput,
  },
})
export default class FlowsenseInput extends Vue {
  @ns.flowsense.State('inputVisible') private visible!: boolean;
  @ns.flowsense.State('voiceEnabled') private isVoiceEnabled!: boolean;
  @ns.flowsense.Mutation('toggleVoice') private toggleFlowsenseVoice!: () => void;
  @ns.dataset.State('lastList') private datasetList!: DatasetInfo[];
  @ns.dataflow.Getter('nodeTypes') private nodeTypes!: NodeType[];
  @ns.dataflow.Getter('tabularDatasets') private tabularDatasets!: TabularDataset[];
  @ns.dataflow.Getter('nodeLabels') private nodeLabels!: string[];

  private tokens: FlowsenseToken[] = [];
  private text = '';
  private prevText = '';
  private calibratedText = '';
  private voice: Annyang = annyang as Annyang;
  private isVoiceInProgress = false;

  private dropdownElements: DropdownElement[] = [];
  private clickX = 0;
  private clickY = 0;
  private manualCategories: ManualCategory[] = [];

  get microphoneClass() {
    return this.isVoiceInProgress ? 'active' : '';
  }

  get dropdownStyle() {
    return {
      left: this.clickX + 'px',
      top: this.clickY + 'px',
    };
  }

  private mounted() {
    this.voice.addCallback('soundstart', () => {
      this.isVoiceInProgress = true;
    });
    this.voice.addCallback('result', possiblePhrases => {
      const phrases: string[] = possiblePhrases as any; // tslint:disable-line no-any
      console.log(phrases);
      const cursorPosition = this.getCursorPosition();
      const newText = this.text.slice(0, cursorPosition) + phrases[0] + this.text.slice(cursorPosition);
      this.onTextInput(newText);
      this.isVoiceInProgress = false;
      this.voice.abort();
      this.voice.start();
    });
  }

  /**
   * Parses the text into tokens, separated by spaces.
   */
  private parseInput(text: string) {
    let numTokens = 0;
    for (let i = 0; i < text.length; i++) {
      if (isSeparator(text[i])) {
        this.tokens[numTokens++] = {
          index: i,
          text: text[i],
          chosenCategory: 0,
          categories: [{
            category: FlowsenseTokenCategory.NONE,
            value: [],
          }],
          manuallySet: false,
          isPhrase: false,
        };
        continue;
      }
      let j = i;
      let tokenText = '';
      while (j < text.length && !isSeparator(text[j])) {
        tokenText += text[j++];
      }
      this.tokens[numTokens] = {
        index: i,
        text: tokenText,
        chosenCategory: -1,
        categories: [{
          category: FlowsenseTokenCategory.NONE,
          displayText: '',
          annotation: '/(none)',
          value: [],
        }],
        manuallySet: false,
        isPhrase: false,
      };
      numTokens++;
      i = j - 1;
    }
    this.tokens = this.tokens.slice(0, numTokens);
    this.checkTokenCategories();
  }

  /**
   * Parses each token and checks if the token is one of the special utterance category.
   * Performs exact match on tokens to avoid input text length changes while the user is typing.
   */
  private checkTokenCategories() {
    this.tokens.forEach((token, index) => {
      if (token.chosenCategory !== -1 && token.manuallySet) {
        // If the token's category is manually set, do not update.
        return;
      }
      if (isSeparator(token.text)) { // skip separator
        return;
      }
      if (token.isPhrase) { // Skip identified compound tokens in a phrase.
        return;
      }
      let iteration = 2;
      while (iteration--) {
        if (iteration === 0 && index + 2 >= this.tokens.length) {
          continue;
        }
        const tokenText = iteration === 1 ? token.text :
          token.text + this.tokens[index + 1].text + this.tokens[index + 2].text;
        this.datasetList.forEach(dataset => {
          const matchedRawName = dataset.originalname.match(/^(.*)\..*/);
          const rawName = matchedRawName !== null ? matchedRawName[1] : null;
          if (matchToken(tokenText, dataset.originalname) || (rawName && matchToken(tokenText, rawName))) {
            token.categories.push({
              category: FlowsenseTokenCategory.DATASET,
              displayText: dataset.originalname,
              annotation: '/dataset',
              value: [dataset.originalname, dataset.filename],
            });
          }
        });

        this.nodeTypes.forEach(nodeType => {
          if (matchToken(tokenText, nodeType.id) || matchToken(tokenText, nodeType.title)) {
            token.categories.push({
              category: FlowsenseTokenCategory.NODE_TYPE,
              displayText: nodeType.title,
              annotation: '/node type',
              value: [nodeType.id],
            });
          }
        });

        this.nodeLabels.forEach(label => {
          if (matchToken(tokenText, label)) {
            token.categories.push({
              category: FlowsenseTokenCategory.NODE_LABEL,
              displayText: label,
              annotation: '/node label',
              value: [label],
            });
          }
        });

        this.tabularDatasets.forEach(tabularDataset => {
          const columnNames = tabularDataset.getColumns().map(column => column.name);
          for (const name of columnNames) {
            if (matchToken(tokenText, name)) {
              token.categories.push({
                category: FlowsenseTokenCategory.COLUMN,
                displayText: name,
                annotation: '/column ' + tabularDataset.getName(),
                value: [name, tabularDataset.getName(), tabularDataset.getHash()],
              });
            }
          }
        });

        if (token.categories.length > 1) {
          const manual = this.manualCategories.find(category => category.startIndex === token.index);
          token.chosenCategory = manual !== undefined ? manual.chosenCategory : 1;
          break;
        }
      }
      if (token.chosenCategory === -1) {
        token.chosenCategory = 0;
      } else if (iteration === 0) { // bigram identified
        token.text += this.tokens[index + 1].text + this.tokens[index + 2].text;
        this.tokens[index + 1].isPhrase = this.tokens[index + 2].isPhrase = true;
      }
    });
    this.tokens = this.tokens.filter(token => !token.isPhrase);
  }

  /**
   * Parses the text input.
   * TODO: Currently we put a limit on the maximum input length based on the input box width, as the UI does not handle
   * long query that exceeds the width of the input box. A long query will cause the input box to horizontally scroll.
   * But the "tag-row" is so far designed to overlap the input text. When scroll happens, the overlap will mess up.
   */
  private onTextInput(text: string | null) {
    const finalText = text || '';
    this.calibratedText = finalText;
    this.$nextTick(() => {
      const width = $(this.$el).find('.width-calibration').width() as number;
      const maxWidth = ($(this.$el).find('#input').width() as number) -
        ($(this.$el).find('#mic').outerWidth() as number);
      const cursorPosition = this.getCursorPosition();
      if (width > maxWidth) {
        showSystemMessage(this.$store, 'exceeded maximum query length', 'warn');
        this.text = ''; // Clear the text so that form-input can upate <input>'s value properly
        this.$nextTick(() => { // Wait for next tick, otherwise <input> will not get value update.
          this.text = this.prevText;
          this.parseInput(this.text);
          this.$nextTick(() => this.setCursorPosition(cursorPosition === this.text.length ?
            cursorPosition : cursorPosition - 1));
        });
        return;
      }

      const edit = (this.$refs.input as FormInput).getLastEdit();
      // deltaLength characters have been inserted/removed at index cursorPosition.
      // All manually identified category ranges that are after the cursor position are shifted.
      let deltaLength = 0;
      if (edit.type === 'insert' || edit.type === 'delete') {
        deltaLength = edit.value.length;
      } else if (edit.type === 'replace') {
        deltaLength = edit.value.length - (edit.endIndex - edit.startIndex);
      }
      // Note that when edit.type is 'undo', there is currently no way to determine the precise changes on the text.
      // So we cannot preserve the manually set token categories correctly when the undo changes the index of a
      // manually categorized token.

      // When deltaLength is zero, it is a single-character replacement
      this.manualCategories = this.manualCategories.map(range => {
        // If an insertion, deletion, or replacement happens within a manual category range,
        // the range is no longer valid and removed.
        if (edit.type === 'insert' && range.startIndex < edit.startIndex && edit.startIndex < range.endIndex) {
          // Insert strictly within the token.
          return null;
        } else if (areRangesIntersected([range.startIndex, range.endIndex - 1], [edit.startIndex, edit.endIndex - 1])) {
          // Delete or replace touches the range if the two index ranges intersect.
          return null;
        }
        if (range.startIndex >= edit.startIndex) {
          range.startIndex += deltaLength;
          range.endIndex += deltaLength;
        }
        return range;
      }).filter(category => category !== null) as ManualCategory[];
      this.prevText = finalText;
      this.parseInput(finalText);
      this.text = this.tokens.map(token => token.text).join('');
    });
  }

  private getCursorPosition(): number {
    const inputElement = $(this.$el).find('#input')[0] as HTMLInputElement;
    return inputElement.selectionStart as number;
  }

  private setCursorPosition(position: number) {
    const inputElement = $(this.$el).find('#input')[0] as HTMLInputElement;
    inputElement.setSelectionRange(position, position);
  }

  private toggleVoice() {
    this.toggleFlowsenseVoice();
  }

  private onTextSubmit(text: string) {
    console.log(text);
  }

  private clickToken(evt: MouseEvent, index: number) {
    const $target = $(evt.target as Element);
    this.clickX = ($target.offset() as JQuery.Coordinates).left;
    this.clickY = ($target.offset() as JQuery.Coordinates).top + ($target.height() as number) + DROPDOWN_MARGIN_PX;
    this.dropdownElements = this.tokens[index].categories.map((category, categoryIndex) => ({
      text: category.displayText || '',
      annotation: category.annotation || '',
      class: category.category !== FlowsenseTokenCategory.NONE ? 'categorized ' + category.category : '',
      onClick: () => {
        this.tokens[index].chosenCategory = categoryIndex;
        const existing = this.manualCategories.find(range => range.startIndex === this.tokens[index].index &&
          range.endIndex === this.tokens[index].index + this.tokens[index].text.length);
        if (existing) {
          existing.chosenCategory = categoryIndex;
        } else {
          this.manualCategories.push({
            startIndex: this.tokens[index].index,
            endIndex: this.tokens[index].index + this.tokens[index].text.length,
            chosenCategory: categoryIndex,
          });
        }
        this.dropdownElements = []; // hide dropdown
      },
    }));
  }

  @Watch('visible')
  private onVisibleChange() {
    this.dropdownElements = []; // hide dropdown whenever visibility changes
    this.onVoiceEnabledChange();
  }

  @Watch('isVoiceEnabled')
  private onVoiceEnabledChange() {
    if (this.visible && this.isVoiceEnabled) {
      this.voice.start();
    } else {
      console.log('abort');
      this.isVoiceInProgress = false;
      this.voice.abort();
    }
  }
}
