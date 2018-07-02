import { Component, Vue, Prop } from 'vue-property-decorator';
import axios from 'axios';
import { namespace } from 'vuex-class';

import { API_URL } from '@/common/url';
import { errorMessage } from '@/common/util';

const user = namespace('user');

const MESSAGE_DURATION = 5000;

enum UploadState {
  WAITING = 'waiting',
  DRAGGING = 'dragging',
  UPLOADING = 'uploading',
}

@Component
export default class FileUpload extends Vue {
  @user.State('username') private isLoggedIn!: string;

  @Prop()
  private url!: string;
  @Prop()
  private field!: string;

  private successMessage = '';
  private errorMessage = '';
  private uploadState: UploadState = UploadState.WAITING;
  private filename = '';
  private uploadPercentage = 0;

  public reset() {
    this.uploadState = UploadState.WAITING;
    this.filename = '';
    this.errorMessage = '';
  }

  private onFileDragover() {
    this.uploadState = UploadState.DRAGGING;
  }

  private onFileDragleave() {
    this.uploadState = UploadState.WAITING;
  }

  private onFileDrop(evt: DragEvent) {
    this.onFileChange(evt.dataTransfer.files);
  }

  private onFileChange(files: FileList) {
    if (!files.length) {
      this.reset();
      return;
    }
    const file = files[0];
    this.filename = file.name;

    const data = new FormData();
    data.append(this.field, file);

    this.uploadState = UploadState.UPLOADING;
    this.uploadPercentage = 0;

    axios.post(API_URL + this.url, data, {
      withCredentials: true,
      onUploadProgress: (progressEvt: ProgressEvent) => {
        this.uploadPercentage = Math.floor(progressEvt.loaded / progressEvt.total * 100);
      },
    }).then(res => {
      this.uploadState = UploadState.WAITING;
      this.successMessage = `Uploaded: ${res.data}`;
      setTimeout(() => {
        this.successMessage = '';
      }, MESSAGE_DURATION);
    }).catch(err => {
      this.errorMessage = errorMessage(err);
      this.uploadState = UploadState.WAITING;
    });
  }
}
