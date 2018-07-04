import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import FileUpload from '../file-upload/file-upload';
import DatasetList, { DatasetInfo } from '../dataset-list/dataset-list';

@Component({
  components: {
    FileUpload,
    DatasetList,
  },
})
export default class DatasetPanel extends Vue {
  @Prop()
  private selectable!: boolean;

  private modalVisible = false;

  private datasetSelected: DatasetInfo | null = null;

  public open() {
    this.modalVisible = true;
    (this.$refs.fileUpload as FileUpload).reset();
    (this.$refs.datasetList as DatasetList).getList();
  }

  private close() {
    this.modalVisible = false;
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
    (this.$refs.datasetList as DatasetList).getList();
  }

  @Watch('modalVisible')
  private onModalVisibleChange() {
    if (!this.modalVisible) {
      this.close();
    }
  }
}
