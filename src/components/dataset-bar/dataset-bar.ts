import { Component, Vue } from 'vue-property-decorator';
import FileUpload from '../file-upload/file-upload';

@Component({
  components: {
    FileUpload,
  },
})
export default class DatasetBar extends Vue {
  private dataModalVisible = false;

  private openDataModal() {
    this.dataModalVisible = true;
    (this.$refs.fileUpload as FileUpload).reset();
  }

  private closeDataModal() {
    this.dataModalVisible = false;
  }
}
