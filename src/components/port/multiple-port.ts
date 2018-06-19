import { Component, Vue } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';
import Port from './port';

@Component
export default class MultiplePort extends mixins(Port) {
  protected MAX_CONNECTIONS = Infinity;
}
