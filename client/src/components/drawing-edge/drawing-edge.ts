import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import Port from '@/components/port/port';
import { arrowPath } from '@/components/edge/edge';

@Component
export default class DrawingEdge extends Vue {
  @ns.interaction.State('draggedPort') private draggedPort!: Port;
  @ns.interaction.State('draggedX1') private draggedX1!: number;
  @ns.interaction.State('draggedY1') private draggedY1!: number;
  @ns.interaction.State('draggedX2') private draggedX2!: number;
  @ns.interaction.State('draggedY2') private draggedY2!: number;

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
