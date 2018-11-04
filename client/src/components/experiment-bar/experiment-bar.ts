import { Component, Vue } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class ExperimentBar extends Vue {
  @ns.experiment.State('filename') private experimentFilename!: string;
  @ns.experiment.State('step') private experimentStep!: string;
  @ns.experiment.Mutation('next') private experimentNextStep!: () => void;
  @ns.experiment.Mutation('previous') private experimentPreviousStep!: () => void;
  @ns.modals.Mutation('openExperimentModal') private openExperimentModal!: () => void;
}
