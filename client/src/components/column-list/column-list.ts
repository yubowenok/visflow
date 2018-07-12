import { Vue, Component } from 'vue-property-decorator';
import VueSelect from 'vue-select';

@Component({
  components: {
    VueSelect,
  },
})
export default class ColumnList extends Vue {
  private selected: number[] = [];
  private columns: string[] = [];
}
