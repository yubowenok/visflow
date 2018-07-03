import { Component, Vue } from 'vue-property-decorator';
import FileUpload from '../file-upload/file-upload';
import DatasetList from '../dataset-list/dataset-list';
@Component({
  components: {
    FileUpload,
    DatasetList,
  },
})
export default class DatasetBar extends Vue {
  private dataModalVisible = false;

  private openDataModal() {
    this.dataModalVisible = true;
    (this.$refs.fileUpload as FileUpload).reset();
    (this.$refs.datasetList as DatasetList).getList();
  }

  private closeDataModal() {
    this.dataModalVisible = false;
  }

  private onFileUpload() {
    (this.$refs.datasetList as DatasetList).getList();
  }
}
