import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import EditableText from '@/components/editable-text/editable-text';

@Component({
  components: {
    EditableText,
  },
})
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
  @Prop({ default: false })
  private hasSettings!: boolean;

  private iconized = false;
  private inVisMode = false;
  private labelVisible = false;
  private label = '';

  private created() {
    this.label = this.nodeLabel;
    this.iconized = this.isIconized;
    this.inVisMode = this.isInVisMode;
    this.labelVisible = this.isLabelVisible;
  }

  @Watch('nodeLabel')
  private onNodeLabelChange() {
    this.label = this.nodeLabel;
  }

  private onLabelChange() {
    this.$emit('input:nodeLabel', this.label);
  }

  @Watch('isIconized')
  private onIconizedChange(value: boolean) {
    this.iconized = value;
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
    this.iconized = !this.iconized;
    this.$emit('input:iconized', this.iconized);
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

  private settings() {
    this.$emit('settings');
  }
}
