import { Component, Vue, Prop } from 'vue-property-decorator';
import { getColorScaleGradient } from '@/common/color-scale';

@Component
export default class ColorScaleDisplay extends Vue {
  @Prop()
  private id!: string;

  private get gradient(): { background: string } {
    if (!this.id) {
      return { background: 'none' };
    }
    return {
      background: getColorScaleGradient(this.id),
    };
  }
}
