import { Component, Vue } from 'vue-property-decorator';
import DatasetPanel from '../dataset-panel/dataset-panel';

@Component({
  components: {
    DatasetPanel,
  },
})
export default class DatasetBar extends Vue {
}
