import { Component, Vue, Prop } from 'vue-property-decorator';

interface InitialState {
  isIconized: boolean;
  isInVisMode: boolean;
  isLabelVisible: boolean;
}

@Component
export default class OptionPanel extends Vue {
  @Prop()
  private initialState!: InitialState;
  @Prop()
  private nodeLabel!: string;

  private isIconized = false;
  private isInVisMode = false;
  private isLabelVisible = false;

  private data() {
    return {
      ...this.initialState,
    };
  }

  private toggleIconized() {
    this.$emit('toggle:iconized', this.isIconized);
  }

  private toggleInVisMode() {
    this.$emit('toggle:inVisMode', this.isInVisMode);
  }

  private toggleLabelVisible() {
    this.$emit('toggle:labelVisible', this.isLabelVisible);
  }
}
