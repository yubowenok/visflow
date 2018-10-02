import _ from 'lodash';
import { Vue, Component, Watch } from 'vue-property-decorator';
import { Annyang } from 'annyang';
import annyang from 'annyang';

import ns from '@/store/namespaces';
import FormInput from '@/components/form-input/form-input';
import { FlowsenseTokenCategory, FlowsenseToken, FlowsenseCategorizedToken } from '@/store/flowsense/types';
import * as flowsenseUtil from '@/store/flowsense/util';
import { showSystemMessage, areRangesIntersected,  systemMessageErrorHandler, elementOffset } from '@/common/util';

const DROPDOWN_MARGIN_PX = 10;
const TOKEN_COMPLETION_DROPDOWN_DELAY_MS = 250;
const TOKEN_COMPLETION_DROPDOWN_Y_OFFSET_PX = 10;
const QUERY_COMPLETION_DELAY_MS = 5000;

interface DropdownElement {
  text: string;
  annotation: string; // additional description of the entry, such as the dataset name a column belongs to
  class: string;
  onClick: () => void;
}

interface QueryCompletionDropdownElement {
  tokens: FlowsenseToken[];
  onClick: () => void;
}

interface ManualCategory {
  startIndex: number;
  endIndex: number; // exclusive on the last character
  chosenCategory: number;
}

@Component({
  components: {
    FormInput,
  },
})
export default class FlowsenseInput extends Vue {
  @ns.flowsense.State('inputVisible') private visible!: boolean;
  @ns.flowsense.State('voiceEnabled') private isVoiceEnabled!: boolean;
  @ns.flowsense.Mutation('toggleVoice') private toggleFlowsenseVoice!: () => void;
  @ns.flowsense.Mutation('closeInput') private closeFlowsenseInput!: () => void;
  @ns.flowsense.Action('query') private dispatchQuery!: (tokens: FlowsenseToken[]) => Promise<boolean>;
  @ns.flowsense.Action('autoComplete') private dispatchAutoComplete!: (tokens: FlowsenseToken[]) =>
    Promise<FlowsenseToken[][]>;
  @ns.flowsense.Getter('specialUtterances') private flowsenseSpecialUtterances!: FlowsenseCategorizedToken[];

  private tokens: FlowsenseToken[] = [];
  private text = '';
  private prevText = '';
  private calibratedText = '';
  private voice: Annyang = annyang as Annyang;
  private isVoiceInProgress = false;
  private isWaiting = false; // waiting for query response
  private isInputHidden = false;
  private lastEditPosition = 0;

  // Dropdown elements for selecting token categories
  private tokenCategoryDropdown: DropdownElement[] = [];
  // Dropdown elements for auto completing special utterances
  private tokenCompletionDropdown: DropdownElement[] = [];
  private tokenCompletionDropdownSelectedIndex: number = 0;
  private tokenCompletionDropdownPositionX = 0;
  private tokenCompletionDropdownTimeout: NodeJS.Timer | null = null;
  // Dropdown elements for auto completing query.
  private queryCompletionMessage = '';
  private queryCompletionDropdown: QueryCompletionDropdownElement[] = [];
  private queryCompletionDropdownTimeout: NodeJS.Timer | null = null;
  private queryCompletionDropdownSelectedIndex: number = 0;

  private clickX = 0;
  private clickY = 0;
  private manualCategories: ManualCategory[] = [];

  get microphoneClass() {
    return this.isVoiceInProgress ? 'active' : '';
  }

  get tokenCompletionDropdownStyle() {
    const inputHeight = $(this.$el).find('#input').height() as number;
    return {
      left: this.tokenCompletionDropdownPositionX + 'px',
      top: (inputHeight + TOKEN_COMPLETION_DROPDOWN_Y_OFFSET_PX) + 'px',
    };
  }

  get tokenCategoryDropdownStyle() {
    return {
      left: this.clickX + 'px',
      top: this.clickY + 'px',
    };
  }

  get isTokenCategoryDropdownVisible(): boolean {
    return this.tokenCategoryDropdown.length > 0;
  }

  get isTokenCompletionDropdownVisible(): boolean {
    return this.tokenCompletionDropdown.length > 0;
  }

  get isQueryCompletionDropdownVisible(): boolean {
    return this.queryCompletionDropdown.length > 0 && this.queryCompletionMessage === '';
  }

  private mounted() {
    this.voice.addCallback('soundstart', () => {
      this.isVoiceInProgress = true;
    });
    this.voice.addCallback('result', possiblePhrases => {
      const phrases: string[] = possiblePhrases as any; // tslint:disable-line no-any
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
    this.tokens = flowsenseUtil.parseTokens(text);
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
      if (flowsenseUtil.isSeparator(token.text)) { // skip separator
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


        for (const utterance of this.flowsenseSpecialUtterances) {
          for (const text of utterance.matchText as string[]) {
            if (flowsenseUtil.matchToken(tokenText, text)) {
              token.categories.push(utterance);
            }
          }
        }

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
    this.resetQueryCompletionTimeout();

    this.isInputHidden = false;
    const finalText = text || '';
    this.calibratedText = finalText;
    this.$nextTick(() => {
      const width = $(this.$el).find('.width-calibration').width() as number;
      const maxWidth = ($(this.$el).find('#input').width() as number) -
        ($(this.$el).find('#buttons').outerWidth() as number);
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

      this.lastEditPosition = edit.endIndex;

      this.calibratedText = this.calibratedText.slice(0, edit.endIndex);
      this.$nextTick(() => {
        this.tokenCompletionDropdownPositionX = $(this.$el).find('.width-calibration').width() as number;
      });

      // deltaLength characters have been inserted/removed at index cursorPosition.
      // All manually identified category ranges that are after the cursor position are shifted.
      let deltaLength = 0;
      if (edit.type === 'insert') {
        deltaLength = edit.value.length;
      } else if (edit.type === 'delete') {
        deltaLength = -edit.value.length;
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
      this.text = this.textFromTokens();
      this.generateTokenCompletionDropdown();
    });
    this.generateQueryCompletionDropdown();
  }

  /**
   * Generates text from the parsed tokens.
   */
  private textFromTokens(): string {
    return this.tokens.map(token => token.text).join('');
  }

  /**
   * Handles tab key that can completes a token.
   */
  private onTab() {
    if (this.isTokenCompletionDropdownVisible) {
      this.tokenCompletionDropdown[this.tokenCompletionDropdownSelectedIndex].onClick();
      this.tokenCompletionDropdown = []; // close dropdown
    } else if (this.isQueryCompletionDropdownVisible) {
      this.queryCompletionDropdown[this.queryCompletionDropdownSelectedIndex].onClick();
      this.clearQueryCompletion();
    }
  }

  /**
   * Moves down to choose the next auto completable token.
   */
  private onArrowDown() {
    if (this.isTokenCompletionDropdownVisible) {
      this.tokenCompletionDropdownSelectedIndex++;
      if (this.tokenCompletionDropdownSelectedIndex >= this.tokenCompletionDropdown.length) {
        this.tokenCompletionDropdownSelectedIndex = 0;
      }
    } else if (this.isQueryCompletionDropdownVisible) {
      this.queryCompletionDropdownSelectedIndex++;
      if (this.queryCompletionDropdownSelectedIndex >= this.queryCompletionDropdown.length) {
        this.queryCompletionDropdownSelectedIndex = 0;
      }
    }
  }

  /**
   * Moves up to choose the previous auto completable token.
   */
  private onArrowUp() {
    if (this.isTokenCompletionDropdownVisible) {
      this.tokenCompletionDropdownSelectedIndex--;
      if (this.tokenCompletionDropdownSelectedIndex < 0) {
        this.tokenCompletionDropdownSelectedIndex = this.tokenCompletionDropdown.length - 1;
      }
    } else if (this.isQueryCompletionDropdownVisible) {
      this.queryCompletionDropdownSelectedIndex--;
      if (this.queryCompletionDropdownSelectedIndex < 0) {
        this.queryCompletionDropdownSelectedIndex = this.queryCompletionDropdown.length - 1;
      }
    }
  }

  /**
   * Handles enter key.
   */
  private onEnter() {
    if (this.isTokenCompletionDropdownVisible ||  this.isQueryCompletionDropdownVisible) {
      // If the token/query completion dropdown is visible, choose the option in the dropdown.
      this.onTab();
      return;
    }
    // Otherwise, submit the query.
    this.submitQuery();
  }

  private resetQueryCompletionTimeout() {
    if (this.queryCompletionDropdownTimeout !== null) {
      clearTimeout(this.queryCompletionDropdownTimeout);
    }
    this.queryCompletionDropdownTimeout = setTimeout(() => this.submitQueryCompletion(), QUERY_COMPLETION_DELAY_MS);
  }

  /**
   * Checks the last token in the list and produces an auto completion list for this token.
   */
  private generateTokenCompletionDropdown() {
    let startIndex = 0;
    let editedToken: FlowsenseToken | null = null;
    for (const token of this.tokens) {
      startIndex += token.text.length;
      if (startIndex > this.lastEditPosition) {
        editedToken = token;
        break;
      }
    }
    this.tokenCompletionDropdownSelectedIndex = 0;
    this.tokenCompletionDropdown = [];
    if (this.tokenCompletionDropdownTimeout !== null) {
      clearTimeout(this.tokenCompletionDropdownTimeout);
    }
    if (editedToken === null) {
      return;
    }
    const timeout = TOKEN_COMPLETION_DROPDOWN_DELAY_MS;
    const utterances = this.flowsenseSpecialUtterances.filter(utterance => {
      for (const text of utterance.matchText) {
        if (flowsenseUtil.matchNonTrivialPrefix(text, (editedToken as FlowsenseToken).text)) {
          return true;
        }
      }
      return false;
    });
    const dropdown = utterances.map(category => ({
      text: category.displayText || '',
      annotation: category.annotation || '',
      class: category.category !== FlowsenseTokenCategory.NONE ? 'categorized ' + category.category : '',
      onClick: () => {
        const deltaLength = (category.displayText as string).length - (editedToken as FlowsenseToken).text.length;
        const editPosition = this.lastEditPosition + 1;
        (editedToken as FlowsenseToken).text = category.displayText as string;
        this.text = this.textFromTokens();
        this.parseInput(this.text);
        this.$nextTick(() => {
          const inputElement = $(this.$el).find('#input')[0] as HTMLInputElement;
          inputElement.setSelectionRange(editPosition + deltaLength, editPosition + deltaLength);
        });
        this.tokenCompletionDropdown = []; // close the token completion dropdown
      },
    }));
    if (dropdown.length) {
      this.tokenCompletionDropdownTimeout =
      setTimeout(() => {
        this.tokenCompletionDropdown = dropdown;
      }, timeout);
    }
  }

  /**
   * Generates a token category dropdown for the "index"-th categorizable token.
   */
  private generateTokenCategoryDropdown(index: number) {
    this.tokenCategoryDropdown = this.tokens[index].categories.map((category, categoryIndex) => ({
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
        this.tokenCategoryDropdown = []; // hide dropdown
      },
    }));
  }

  /**
   * Generates auto completion queries in a dropdown.
   */
  private generateQueryCompletionDropdown() {
    this.clearQueryCompletion();
    this.resetQueryCompletionTimeout();
  }

  private submitQueryCompletion() {
    if (this.queryCompletionDropdownTimeout !== null) {
      // submitQueryCompletion may be called from UI button click. Avoid sending the request twice when the user is
      // viewing the suggested queries.
      clearTimeout(this.queryCompletionDropdownTimeout);
    }
    if (!this.visible || !this.tokens.length) {
      return;
    }
    this.isWaiting = true;
    this.dispatchAutoComplete(this.tokens)
      .then(suggestions => {
        if (this.isTokenCategoryDropdownVisible ||
          this.isTokenCompletionDropdownVisible) {
          // A dropdown is already in place. Avoid surprising change of dropdown.
          return;
        }
        this.queryCompletionDropdown = suggestions.map(suggestion => {
          return {
            tokens: suggestion,
            onClick: () => {
              this.queryCompletionDropdown = [];
              this.tokens = suggestion;
              this.text = this.textFromTokens();
              this.setCursorPosition(this.text.length);
            },
          };
        });
        if (!this.queryCompletionDropdown.length) {
          this.queryCompletionMessage = 'no suggestions available';
        }
        $(this.$el).find('#input').focus();
      })
      .finally(() => this.isWaiting = false);
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

  private clickToken(evt: MouseEvent, index: number) {
    this.closeAllDropdowns();

    const $target = $(evt.target as HTMLElement);
    const offset = elementOffset($target, $(this.$el));
    this.clickX = offset.left;
    this.clickY = offset.top + ($target.height() as number) + DROPDOWN_MARGIN_PX;
    this.generateTokenCategoryDropdown(index);
  }

  private onHideInput() {
    this.isInputHidden = true;
  }

  private submitQuery() {
    if (this.isInputHidden) {
      // Do nothing when the input is hidden by clicking on the background.
      return;
    }
    this.isWaiting = true;
    this.dispatchQuery(this.tokens)
      .then(success => {
        if (success) {
          // If the query is successful, clear the text to get ready for the next input.
          this.text = '';
          this.tokens = [];
          this.closeFlowsenseInput();
        } else {
          // If the query is rejected, the text is kept so that it can be edited.
          showSystemMessage(this.$store, 'Sorry, FlowSense does not understand that query', 'warn');
        }
      })
      .catch(err => systemMessageErrorHandler(this.$store)(err))
      .finally(() => this.isWaiting = false);
  }

  private onClickQueryCompletion() {
    this.closeAllDropdowns();
    this.submitQueryCompletion();
  }

  private clearQueryCompletion() {
    this.queryCompletionDropdown = [];
    this.queryCompletionMessage = '';
  }

  private closeAllDropdowns() {
    this.tokenCategoryDropdown = [];
    this.tokenCompletionDropdown = [];
    this.clearQueryCompletion();
  }

  @Watch('visible')
  private onVisibleChange() {
    this.tokenCategoryDropdown = []; // hide dropdown whenever visibility changes
    this.tokenCompletionDropdown = [];
    this.clearQueryCompletion();
    this.onVoiceEnabledChange();
    if (this.visible) {
      this.$nextTick(() => $(this.$el).find('#input').focus()); // wait for transition to complete before focus()
    }
  }

  @Watch('isVoiceEnabled')
  private onVoiceEnabledChange() {
    if (this.visible && this.isVoiceEnabled) {
      this.voice.start();
    } else {
      this.isVoiceInProgress = false;
      this.voice.abort();
    }
  }
}
