import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const message = namespace('message');

@Component
export default class Message extends Vue {
  @message.State('text') private text!: string;
  @message.State('class') private classes!: string;
  @message.Mutation('closeMessage') private closeMessage!: () => void;
}
