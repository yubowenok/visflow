import { Component, Vue, Prop } from 'vue-property-decorator';

import ns from '@/store/namespaces';

export interface OptionPanelInitialState {
  isIconized: boolean;
  isInVisMode: boolean;
  isLabelVisible: boolean;
}

@Component
export default class OptionPanel extends Vue {
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;

  @Prop()
  private initialState!: OptionPanelInitialState;
  @Prop()
  private nodeLabel!: string;
  @Prop({ default: false })
  private enlargeable!: boolean;

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

  private enlarge() {
    this.$emit('enlarge');
  }
}
