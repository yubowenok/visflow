import { Component, Vue } from 'vue-property-decorator';
import DatasetModal from '@/components/modals/dataset-modal/dataset-modal';

@Component({
  components: {
    DatasetModal,
  },
})
export default class DatasetBar extends Vue {
}
