import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Victor from 'victor';
import $ from 'jquery';

import Port from '../port/port';
import * as d3 from 'd3';

import { ARROW_SIZE_PX, ARROW_WING_SIZE_PX } from '@/common/constants';

const dataflow = namespace('dataflow');

export const arrowPath = (base: Point, head: Point): string => {
  const p = new Victor(base.x, base.y);
  const q = new Victor(head.x, head.y);
  if (p.distance(q) <= ARROW_SIZE_PX) {
    return ''; // avoid weird arrow direction when the drag just begins
  }
  const pq = q.clone().subtract(p).normalize();
  const scalar = new Victor(ARROW_SIZE_PX, ARROW_SIZE_PX);
  const smallScalar = new Victor(ARROW_WING_SIZE_PX, ARROW_WING_SIZE_PX);
  const pqLeft = pq.clone().rotate(Math.PI / 2);
  const pqRight = pq.clone().rotate(-Math.PI / 2);

  const root = q.clone().subtract(pq.clone().multiply(scalar));

  const points: number[][] = [
    q.toArray(),
    root.clone().add(pqLeft.multiply(smallScalar)).toArray(),
    root.clone().add(pqRight.multiply(smallScalar)).toArray(),
  ];
  return d3.line().curve(d3.curveLinearClosed)(points as Array<[number, number]>) as string;
};

@Component
export default class Edge extends Vue {
  public source!: Port;
  public target!: Port;

  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;
  private edgePathStr: string = '';

  public updateCoordinates() {
    const sourceCenter = this.source.getCenterCoordinates();
    this.x1 = sourceCenter.x;
    this.y1 = sourceCenter.y;
    const targetCenter = this.target.getCenterCoordinates();
    this.x2 = targetCenter.x;
    this.y2 = targetCenter.y;
  }

  private mounted() {
    this.updateCoordinates();

    // Add the edge to the incident lists of ports.
    this.source.addEdge(this);
    this.target.addEdge(this);
  }

  get getCurvePath(): string {
    const sx = this.x1;
    const sy = this.y1;
    const ex = this.x2;
    const ey = this.y2;

    const points: Array<[number, number]> = [[sx, sy]];
    // Draw edges in 2 or 3 segments
    const yDirDown = ey > sy;
    if (ex >= sx) {
      let headWidth = Math.max(0, (ex - sx) / 2 - ARROW_SIZE_PX);
      const tailWidth = ex - sx - headWidth;
      if (tailWidth < ARROW_SIZE_PX && Math.abs(ey - sy) >= ARROW_SIZE_PX) {
        // tail too short, and sufficient y space
        headWidth = ex - sx;
        // go right and then up
        points.push([sx + headWidth, sy]);
      } else {
        // go right, up, then right
        points.push([sx + headWidth, sy]);
        points.push([sx + headWidth, ey]);
      }
    } else {  // ex < ey
      let midy;
      const boxSource = this.source.node.getBoundingBox();
      const boxTarget = this.target.node.getBoundingBox();
      const sourceYrange = [boxSource.y, boxSource.y + boxSource.h];
      const targetYrange = [boxTarget.y, boxTarget.y + boxTarget.h];
      if (sourceYrange[0] <= targetYrange[1] &&
          sourceYrange[1] >= targetYrange[0]) {
        // two nodes have intersecting y range, get around
        if (!yDirDown) {
          // up is from human view (reversed screen coordinate)
          midy = targetYrange[0] - 20;
        } else {
          midy = targetYrange[1] + 20;
        }
      } else {
        midy = (Math.max(sourceYrange[0], targetYrange[0]) +
          Math.min(sourceYrange[1], targetYrange[1])) / 2;
      }
      // 2 turns
      points.push([sx, midy]);
      points.push([ex, midy]);
    }
    const lastPoint: [number, number] = [ex, ey];
    points.push(lastPoint);

    const edgePath = d3.line().curve(d3.curveBundle.beta(1))(points) as string;
    this.edgePathStr = edgePath;
    return edgePath;
  }

  get getArrowPath(): string {
    return arrowPath(this.getArrowBase(this.edgePathStr), { x: this.x2, y: this.y2 });
  }

  private getArrowBase(edgePath: string): Point {
    const curveCoords = (edgePath.match(/^.*([,CLM].*,.*C(?:.*,.*)+)L.*$/) as string[])[1]
      .split(/[C,]/)
      .slice(1)
      .map((val: string): number => +val);
    const xCoords = curveCoords.filter((e: number, index: number) => index % 2 === 0);
    const yCoords = curveCoords.filter((e: number, index: number) => index % 2 === 1);
    const bezierFunc = (t: number, val: number[]) => {
      const ct = 1 - t;
      return ct * ct * ct * val[0] + t * t * t * val[3] +
        3 * ct * t * (ct * val[1] + t * val[2]);
    };
    return {
      x: bezierFunc(.6, xCoords),
      y: bezierFunc(.6, yCoords),
    };
  }
}
