import { Component, Vue } from 'vue-property-decorator';
import ClickOutside from '../../directives/click-outside';

@Component({
  directives: {
    ClickOutside,
  },
})
export default class Node extends Vue {
  public minimize() {
    console.log('node.minimize');
  }

  public maximize() {
    console.log('node.maximize');
  }
}
