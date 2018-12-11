import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import FileUpload from '@/components/file-upload/file-upload';
import DatasetList from '@/components/dataset-list/dataset-list';
import { DatasetInfo } from '@/store/dataset/types';
import BaseModal from '@/components/modals/base-modal/base-modal';

@Component({
  components: {
    FileUpload,
    DatasetList,
    BaseModal,
  },
})
export default class DatasetModal extends Vue {
  @Prop()
  private selectable!: boolean;

  // Dataset modal manages the visible state in itself instead of the global store.
  private visible = false;

  private datasetSelected: DatasetInfo | null = null;

  public open() {
    this.visible = true;
    (this.$refs.fileUpload as FileUpload).reset();

    // Refresh the list on each open call.
    (this.$refs.datasetList as DatasetList).getList();
  }

  private close() {
    this.visible = false;
    this.datasetSelected = null;
  }

  private onDatasetListSelect(dataset: DatasetInfo) {
    this.datasetSelected = dataset;
  }

  private onDatasetListDeselect() {
    this.datasetSelected = null;
  }

  private selectDataset() {
    this.$emit('selectDataset', this.datasetSelected);
    this.close();
  }

  private onFileUpload() {
    // Refresh the list of datasets.
    (this.$refs.datasetList as DatasetList).getList();
  }

  @Watch('visible')
  private onvisibleChange() {
    if (!this.visible) {
      this.close();
    }
  }
}
