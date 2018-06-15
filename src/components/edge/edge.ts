import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Edge extends Vue {
  get pathStr(): string {
    return '';
  }
}
