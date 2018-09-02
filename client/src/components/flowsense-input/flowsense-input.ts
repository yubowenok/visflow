import { Vue, Component, Watch } from 'vue-property-decorator';
import { Annyang } from 'annyang';
import annyang from 'annyang';

import ns from '@/store/namespaces';
import FormInput from '@/components/form-input/form-input';
import { DatasetInfo } from '@/store/dataset/types';
import TabularDataset from '@/data/tabular-dataset';
import { NodeType } from '@/store/dataflow/types';
import { showSystemMessage } from '@/common/util';

enum FlowsenseTokenCategory {
  UNKNOWN = 'unknown', // token category not yet checked
  NONE = 'none', // no identifiable category
  DATASET = 'dataset',
  COLUMN = 'column',
  NODE_TYPE = 'node-type',
  NODE_LABEL = 'node-label',
}

interface FlowsenseToken {
  index: number;
  text: string;
  value: string[];
  category: FlowsenseTokenCategory;
  manuallySet: boolean;
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
      dp[i][j] = Math.min(dp[i][j - 1], dp[i - 1][j]) + 1;
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

  private mounted() {
    this.voice.addCallback('resultNoMatch', possiblePhrases => {
      const phrases: string[] = possiblePhrases as any; // tslint:disable-line no-any
      console.log(phrases);
      const cursorPosition = this.getCursorPosition();
      const newText = this.text.slice(0, cursorPosition) + phrases[0] + this.text.slice(cursorPosition);
      console.log(newText);
      this.onTextInput(newText);
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
          value: [text[i]],
          category: FlowsenseTokenCategory.NONE,
          manuallySet: false,
        };
        continue;
      }
      let j = i;
      let tokenText = '';
      while (j < text.length && !isSeparator(text[j])) {
        tokenText += text[j++];
      }
      const token = this.tokens[numTokens];
      if (token === undefined || token.index !== i || token.text !== tokenText) {
        this.tokens[numTokens] = {
          index: i,
          text: tokenText,
          value: [tokenText], // default value of a token is its text
          category: FlowsenseTokenCategory.UNKNOWN,
          manuallySet: false,
        };
      }
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
    this.tokens.forEach(token => {
      if (token.category !== FlowsenseTokenCategory.UNKNOWN && token.manuallySet) {
        // If the token's category is manually set, do not update.
        return;
      }

      this.datasetList.forEach(dataset => {
        const matchedRawName = dataset.originalname.match(/^(.*)\..*/);
        const rawName = matchedRawName !== null ? matchedRawName[1] : null;
        if (matchToken(token.text, dataset.originalname) || (rawName && matchToken(token.text, rawName))) {
          token.category = FlowsenseTokenCategory.DATASET;
          token.text = rawName || dataset.originalname;
          token.value = [dataset.filename];
        }
      });

      this.nodeTypes.forEach(nodeType => {
        if (matchToken(token.text, nodeType.id) || matchToken(token.text, nodeType.title)) {
          token.category = FlowsenseTokenCategory.NODE_TYPE;
          token.text = nodeType.title.toLowerCase();
          token.value = [nodeType.id];
        }
      });

      this.nodeLabels.forEach(label => {
        if (matchToken(token.text, label)) {
          token.category = FlowsenseTokenCategory.NODE_LABEL;
          token.text = label;
          token.value = [label];
        }
      });

      this.tabularDatasets.forEach(tabularDataset => {
        const columnNames = tabularDataset.getColumns().map(column => column.name);
        for (const name of columnNames) {
          if (matchToken(token.text, name)) {
            token.category = FlowsenseTokenCategory.COLUMN;
            token.text = name;
            token.value = [name, tabularDataset.getName(), tabularDataset.getHash()];
          }
        }
      });

      if (token.category === FlowsenseTokenCategory.UNKNOWN) {
        token.category = FlowsenseTokenCategory.NONE;
      }
    });
  }

  /**
   * Parses the text input.
   * TODO: Currently we put a limit on the maximum input length, as the UI does not handle long query that exceeds the
   * width of the input box. A long query will cause the input box to horizontally scroll. But the "tag-row" is so far
   * designed to overlap the input text. When scroll happens, the overlap will mess up.
   */
  private onTextInput(text: string | null) {
    const finalText = text || '';
    this.calibratedText = finalText;
    this.$nextTick(() => {
      const width = $(this.$el).find('.width-calibration').width() as number;
      const maxWidth = ($(this.$el).find('#input').width() as number) -
        ($(this.$el).find('#mic').outerWidth() as number);
      if (width > maxWidth) {
        showSystemMessage(this.$store, 'exceeded maximum query length', 'warn');
        const cursorPosition = this.getCursorPosition();
        this.text = ''; // Clear the text so that form-input can upate <input>'s value properly
        this.$nextTick(() => { // Wait for next tick, otherwise <input> will not get value update.
          this.text = this.prevText;
          this.parseInput(this.text);
          this.$nextTick(() => this.setCursorPosition(cursorPosition - 1));
        });
        return;
      }
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

  @Watch('visible')
  private onVisibleChange() {
    this.onVoiceEnabledChange();
  }

  @Watch('isVoiceEnabled')
  private onVoiceEnabledChange() {
    if (this.visible && this.isVoiceEnabled) {
      this.voice.start({ autoRestart: true, continuous: true });
    } else {
      console.log('abort');
      this.voice.abort();
    }
  }
}
