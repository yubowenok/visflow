import { Vue, Component, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';
import { ExperimentInfo } from '@/store/experiment/types';

@Component({
  components: {
    BaseModal,
  },
})
export default class ExperimentModal extends Vue {
  @ns.modals.State('experimentModalVisible') private experimentModalVisible!: boolean;
  @ns.modals.Mutation('openExperimentModal') private openExperimentModal!: () => void;
  @ns.modals.Mutation('closeExperimentModal') private closeExperimentModal!: () => void;
  @ns.experiment.Action('start') private startExperiment!: () => Promise<ExperimentInfo>;
  @ns.experiment.State('filename') private filename!: string;

  private steps = [
    'consentForm',
    'overview',
    'tutorial',
    'practice',
  ];
  private stepIndex = 0;
  private titles = {
    consentForm: 'VisFlow User Study: Consent Form for IRB-FY2018-2102',
    overview: 'User Study Overview',
    tutorial: 'VisFlow Tutorial',
    practice: 'System Practice',
  };
  private experimentId = '(unknown)';

  get sessionLink(): string {
    return window.location.protocol + '//' + window.location.host + '/experiment/' + this.filename;
  }

  get currentStep(): string {
    return this.steps[this.stepIndex];
  }

  private agreeAndStart() {
    this.stepIndex++;

    this.startExperiment()
      .then(() => {
      });
  }

  private cancel() {
    if (this.stepIndex <= 1) {
      this.$store.commit('router/replace', '/');
    }
    (this.$refs.modal as BaseModal).close();
  }

  @Watch('experimentModalVisible')
  private onVisibleChange() {
    if (!this.experimentModalVisible) {
      this.cancel();
    }
  }
}
