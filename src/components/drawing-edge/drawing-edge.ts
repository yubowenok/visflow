import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import Port from '../port/port';
import { arrowPath } from '../edge/edge';

const interaction = namespace('interaction');

@Component
export default class DrawingEdge extends Vue {
  @interaction.State('draggedPort') private draggedPort!: Port;
  @interaction.State('draggedX1') private draggedX1!: number;
  @interaction.State('draggedY1') private draggedY1!: number;
  @interaction.State('draggedX2') private draggedX2!: number;
  @interaction.State('draggedY2') private draggedY2!: number;

  get start(): Point {
    return !this.draggedPort.isInput ?
      { x: this.draggedX1, y: this.draggedY1 } : { x: this.draggedX2, y: this.draggedY2 };
  }
  get end(): Point {
    return !this.draggedPort.isInput ?
      { x: this.draggedX2, y: this.draggedY2 } : { x: this.draggedX1, y: this.draggedY1 };
  }

  get getArrowPath(): string {
    return arrowPath(this.start, this.end);
  }
}
