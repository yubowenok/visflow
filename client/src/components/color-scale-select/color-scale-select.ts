import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
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
  private value!: string | null;
  @Prop({ default: true })
  private clearable!: boolean;

  private scaleId: string | null = null;
  private prevScaleId: string | null = null;

  @Watch('value')
  private onValueChange() {
    this.scaleId = this.value || null;
  }

  get colorScaleOptions() {
    return allColorScaleInfo.map(info => _.extend({}, info, { value: info.id }));
  }

  private created() {
    this.scaleId = this.prevScaleId = this.value;
  }

  private onScaleSelect() {
    this.$emit('input', this.scaleId, this.prevScaleId);
    this.$emit('change', this.scaleId, this.prevScaleId);
    this.prevScaleId = this.scaleId;
  }
}
