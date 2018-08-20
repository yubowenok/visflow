/**
 * @fileOverview Provides a UI for editing a list of constants.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';
import _ from 'lodash';

import { ValueType } from '@/data/parser';
import { valueDisplay } from '@/common/util';

export const getConstantsListInputType = (constants: string[], prevConstants: string[],
                                          semantic: string = 'constant'): string => {
  if (constants.length && _.isEqual(constants.concat().sort(), prevConstants.concat().sort())) {
    return `order ${semantic}s`;
  } else if (constants.length - prevConstants.length > 0) {
    return 'add ' + semantic + (constants.length - prevConstants.length > 1 ? 's' : '');
  } else if (constants.length - prevConstants.length === -1) {
    return 'remove ' + semantic;
  } else if (!constants.length && prevConstants.length) {
    return `clear ${semantic}s`;
  } else {
    return `input ${semantic}s`;
  }
};

@Component
export default class ConstantsList extends Vue {
  @Prop({ type: Array, default: [] })
  private value!: string[];

  @Prop({ default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: null })
  private type!: ValueType | null;

  private constants: string[] = [];
  private prevConstants: string[] = [];

  // User typed text to be added as constant
  private entry: string = '';

  private created() {
    this.constants = this.value.concat();
    this.prevConstants = this.constants.concat();
  }

  private mounted() {
    this.sortable();
    if (this.disabled) {
      this.disableSortable();
    }
  }

  @Watch('disabled')
  private onDisabledChange() {
    if (this.disabled) {
      this.disableSortable();
    } else {
      this.enableSortable();
    }
  }

  private enableSortable() {
    $(this.$refs.constants).sortable('enable');
  }

  private disableSortable() {
    $(this.$refs.constants).sortable('disable');
  }

  private sortable() {
    const $constants = $(this.$refs.constants);
    const getNewOrder = (evt: Event, ui: JQueryUI.SortableUIParams): string[] => {
      const tags = $constants.find('.constant').not('.ui-sortable-helper');
      const values: string[] = [];
      for (const tag of tags) {
        const $tag = $(tag);
        const index = $tag.hasClass('ui-sortable-placeholder') ?
          +(ui.item.attr('id') as string) : +($(tag).attr('id') as string);
        values.push(this.constants[index]);
      }
      return values;
    };

    $constants.sortable({
      change: (evt, ui) => {
        this.$emit('change', getNewOrder(evt, ui));
      },
      stop: (evt, ui) => {
        this.save(getNewOrder(evt, ui));
      },
    });
  }

  private display(text: string) {
    return !this.type ? text : valueDisplay(text, this.type);
  }

  private add() {
    if (!this.entry) {
      return; // avoid adding empty entry on Enter key
    }
    this.save(this.constants.concat([this.entry]));
    this.entry = '';
  }

  private addList() {
    if (!this.entry) {
      return;
    }
    const values = this.entry.split(',').map(s => s.trim());
    this.save(this.constants.concat(values));
    this.entry = '';
  }

  private clear() {
    this.save([]);
  }

  private remove(index: number) {
    const newConstants = this.constants.concat();
    _.pullAt(newConstants, index);
    this.save(newConstants);
  }

  private save(values: string[]) {
    if (!_.isEqual(this.constants, values)) {
      this.constants = values.concat();
      this.$emit('input', this.constants, this.prevConstants);
      this.prevConstants = this.constants.concat();
    }
  }
}
