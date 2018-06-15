import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Victor from 'victor';
import * as d3 from 'd3';

import { ARROW_SIZE_PX } from '@/common/constants';

const interaction = namespace('interaction');

@Component
export default class DrawingEdge extends Vue {
  @interaction.State('draggedX1') private x1!: number;
  @interaction.State('draggedY1') private y1!: number;
  @interaction.State('draggedX2') private x2!: number;
  @interaction.State('draggedY2') private y2!: number;

  get arrowPath(): string {
    const p = new Victor(this.x1, this.y1);
    const q = new Victor(this.x2, this.y2);
    if (p.distance(q) <= ARROW_SIZE_PX) {
      return ''; // avoid weird arrow direction when the drag just begins
    }
    const pq = q.clone().subtract(p).normalize();
    const scalar = new Victor(ARROW_SIZE_PX, ARROW_SIZE_PX);
    const smallScalar = new Victor(ARROW_SIZE_PX / 3, ARROW_SIZE_PX / 3);
    const pqLeft = pq.clone().rotate(Math.PI / 2);
    const pqRight = pq.clone().rotate(-Math.PI / 2);

    const root = q.clone().subtract(pq.clone().multiply(scalar));

    const points: number[][] = [
      q.toArray(),
      root.clone().add(pqLeft.multiply(smallScalar)).toArray(),
      root.clone().add(pqRight.multiply(smallScalar)).toArray(),
    ];
    return d3.line().curve(d3.curveLinearClosed)(points as Array<[number, number]>) as string;
  }
}
