import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';

export interface OptionPanelInitialState {
  isIconized: boolean;
  isInVisMode: boolean;
  isLabelVisible: boolean;
}

@Component
export default class OptionPanel extends Vue {
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;

  @Prop({ default: false })
  private isIconized!: boolean;
  @Prop({ default: false })
  private isInVisMode!: boolean;
  @Prop({ default: false })
  private isLabelVisible!: boolean;
  @Prop()
  private nodeLabel!: string;
  @Prop({ default: false })
  private enlargeable!: boolean;

  private iconize = false;
  private inVisMode = false;
  private labelVisible = false;

  @Watch('isIconized')
  private onIconizedChange(value: boolean) {
    this.iconize = value;
  }

  @Watch('isInVisMode')
  private onInVisModeChange(value: boolean) {
    this.inVisMode = value;
  }

  @Watch('isLabelVisible')
  private onLabelVisible(value: boolean) {
    this.labelVisible = value;
  }

  private toggleIconized() {
    this.iconize = !this.iconize;
    this.$emit('input:iconized', this.iconize);
  }

  private toggleInVisMode() {
    this.inVisMode = !this.inVisMode;
    this.$emit('input:inVisMode', this.inVisMode);
  }

  private toggleLabelVisible() {
    this.labelVisible = !this.labelVisible;
    this.$emit('input:labelVisible', this.labelVisible);
  }

  private enlarge() {
    this.$emit('enlarge');
  }
}
