import { Vue, Component, Prop } from 'vue-property-decorator';
import VueSelect from '@/components/vue-select/vue-select';
import _ from 'lodash';
import $ from 'jquery';

import ns from '@/store/namespaces';
import { MessageModalOptions } from '@/store/modals/types';
import { ColumnSelectOption } from '@/components/column-select/column-select';

const NUM_CLUTTER_COLUMNS = 20;
@Component({
  components: {
    VueSelect,
  },
})
export default class ColumnList extends Vue {
  @ns.modals.Mutation('openMessageModal') private openMessageModal!: (options: MessageModalOptions) => void;

  @Prop()
  private columns!: ColumnSelectOption[];
  @Prop({ type: Array })
  private value!: number[];

  // All "input" events are fired when changing this array.
  private selected: number[] = [];

  private mounted() {
    this.selected = this.value.concat();
  }

  /**
   * Handles dragging re-order.
   */
  private updated() {
    const $el = $(this.$el);

    const getNewOrder = (evt: Event, ui: JQueryUI.SortableUIParams): number[] => {
      const tags = $el.find('.selected-tag').not('.ui-sortable-helper');
      const values: number[] = [];
      for (const tag of tags) {
        const $tag = $(tag);
        if ($tag.hasClass('ui-sortable-placeholder')) {
          values.push(+(ui.item.attr('id') as string));
        } else {
          values.push(+($(tag).attr('id') as string));
        }
      }
      const newSelected = values;
      return newSelected;
    };

    $el.find('.dropdown-toggle').sortable({
      items: '> .selected-tag',
      start: () => {
        const tags = $el.find('.selected-tag').not('.ui-sortable-placeholder');
        _.each(tags, (tag, index) => {
          $(tag).attr('id', this.selected[index].toString());
        });
      },
      change: (evt, ui) => {
        // Emits the change but does not touch this.selected, which will be updated on sortable stop().
        this.$emit('input', getNewOrder(evt, ui));
      },
      stop: (evt, ui) => {
        // Finalize the selected values with child component.
        this.selected = getNewOrder(evt, ui);
        // The change has already been emitted on change(), so we do not set this.selected here.
        // Return false to cancel JQuery sortable to avoid changing the DOM at the same time with vue-select!
        return false;
      },
    });
  }

  private clear() {
    this.selected = [];
  }

  private all() {
    const select = () => {
      this.selected = this.columns.map(column => column.value);
    };
    if (this.columns.length > NUM_CLUTTER_COLUMNS) {
      this.openMessageModal({
        title: 'Too Many Columns',
        message: `You have selected ${this.columns.length} columns that may cause clutter. Do you want to proceed?`,
        onConfirm: select,
      });
      return;
    }
    select();
  }

  private sort() {
    // First concat then sort, otherwise the child's value will be sorted as well, and no input event will be fired
    // from child if its old value equals its new value.
    this.selected = this.selected.concat().sort((a, b) => a - b);
  }

  private onListSelect() {
    this.$emit('input', this.selected);
  }
}
