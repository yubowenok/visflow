/**
 * @fileOverview Provides a UI for editing a list of constants.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';
import _ from 'lodash';

import { ValueType } from '@/data/parser';
import { valueDisplay } from '@/common/util';

@Component
export default class ConstantsList extends Vue {
  @Prop({ type: Array, default: [] })
  private value!: string[];

  @Prop({ default: false })
  private disabled!: boolean;

  @Prop({ type: String, default: null })
  private type!: ValueType | null;

  private constants: string[] = [];

  // User typed text to be added as constant
  private entry: string = '';

  private created() {
    this.constants = this.value;
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
        this.$emit('input', getNewOrder(evt, ui));
      },
      stop: (evt, ui) => {
        this.constants = getNewOrder(evt, ui);
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
    this.constants.push(this.entry);
    this.$emit('input', this.constants);
    this.entry = '';
  }

  private addList() {
    if (!this.entry) {
      return;
    }
    const values = this.entry.split(',').map(s => s.trim());
    this.constants = this.constants.concat(values);
    this.$emit('input', this.constants);
    this.entry = '';
  }

  private clear() {
    this.constants = [];
    this.$emit('input', this.constants);
  }

  private remove(index: number) {
    this.constants.splice(index, 1);
    this.$emit('input', this.constants);
  }
}
