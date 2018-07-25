import { Vue, Component, Prop } from 'vue-property-decorator';
import _ from 'lodash';

import FormSelect from '@/components/form-select/form-select';
import ColorScaleDisplay from '@/components/color-scale-display/color-scale-display';
import { allColorScaleInfo } from '@/common/color-scale';

@Component({
  components: {
    FormSelect,
    ColorScaleDisplay,
  },
})
export default class ColorScaleSelect extends Vue {
  @Prop({ type: String })
  private value!: string;
  @Prop({ default: true })
  private clearable!: boolean;

  private scaleId: string | null = null;

  get colorScaleOptions() {
    return allColorScaleInfo.map(info => _.extend({}, info, { value: info.id }));
  }

  private created() {
    this.scaleId = this.value || null;
  }

  private onScaleSelect() {
    this.$emit('input', this.scaleId);
  }
}
