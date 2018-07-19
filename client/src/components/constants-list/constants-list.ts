/**
 * @fileOverview Provides a UI for editing a list of constants.
 */
import { Component, Vue, Prop } from 'vue-property-decorator';
import $ from 'jquery';
import _ from 'lodash';

@Component
export default class ConstantsList extends Vue {
  @Prop({
    type: Array,
    default: [],
  })
  private value!: string[];

  private constants: string[] = [];

  // User typed text to be added as constant
  private entry: string = '';

  private created() {
    this.constants = this.value;
  }

  private mounted() {
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

    $(this.$refs.constants).sortable({
      change: (evt, ui) => {
        this.$emit('input', getNewOrder(evt, ui));
      },
      stop: (evt, ui) => {
        this.constants = getNewOrder(evt, ui);
      },
    });
  }

  private add() {
    if (!this.entry) {
      return; // avoid adding empty entry on Enter key
    }
    this.constants.push(this.entry);
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
