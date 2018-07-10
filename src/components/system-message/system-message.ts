import { Component, Vue, Prop } from 'vue-property-decorator';
import ns from '@/store/namespaces';
@Component
export default class Message extends Vue {
  @ns.message.State('text') private text!: string;
  @ns.message.State('class') private classes!: string;
  @ns.message.Mutation('closeMessage') private closeMessage!: () => void;
}
