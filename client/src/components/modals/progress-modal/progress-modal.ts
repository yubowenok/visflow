import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class ProgressModal extends Vue {
  @ns.modals.State('inProgress') private inProgress!: boolean;
  @ns.modals.State('progressPercentage') private progressPercentage!: number;
  @ns.modals.State('progressMessage') private progressMessage!: string;

  get label(): string {
    const percentage = Math.floor(this.progressPercentage) + '%';
    return this.progressMessage ? this.progressMessage + ' ' + percentage : percentage;
  }
}
