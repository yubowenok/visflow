import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class PortPanel extends Vue {
  @Prop()
  private portId!: string;
}
