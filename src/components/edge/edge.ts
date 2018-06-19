import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Victor from 'victor';
import { TweenLite } from 'gsap';
import _ from 'lodash';

import Port from '../port/port';
import * as d3 from 'd3';

import { ARROW_SIZE_PX, ARROW_WING_SIZE_PX, LONG_ANIMATION_DURATION_S } from '@/common/constants';
import ContextMenu from '../context-menu/context-menu';

const dataflow = namespace('dataflow');

export const arrowPath = (base: Point, head: Point): string => {
  const p = new Victor(base.x, base.y);
  const q = new Victor(head.x, head.y);
  if (p.distance(q) <= ARROW_SIZE_PX * .1) {
    return ''; // avoid weird arrow direction when the drag just begins
  }
  const pq = q.clone().subtract(p).normalize();
  const pqLeft = pq.clone().rotate(Math.PI / 2);
  const pqRight = pq.clone().rotate(-Math.PI / 2);

  const root = q.clone().subtract(pq.clone().multiplyScalar(ARROW_SIZE_PX));

  const points: number[][] = [
    q.toArray(),
    root.clone().add(pqLeft.multiplyScalar(ARROW_WING_SIZE_PX)).toArray(),
    root.clone().add(pqRight.multiplyScalar(ARROW_WING_SIZE_PX)).toArray(),
  ];
  return d3.line().curve(d3.curveLinearClosed)(points as Array<[number, number]>) as string;
};

@Component({
  components: {
    ContextMenu,
  },
})
export default class Edge extends Vue {
  public source!: Port;
  public target!: Port;

  @dataflow.Mutation('removeEdge') private dataflowRemoveEdge!: (edge: Vue) => void;

  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;
  private edgePathStr: string = '';

  private isHovered: boolean = false;

  public getEdgeSvgNode(): Element {
    return this.$refs.edge as Element;
  }

  public updateCoordinates() {
    const sourceCenter = this.source.getCenterCoordinates();
    this.x1 = sourceCenter.x;
    this.y1 = sourceCenter.y;
    const targetCenter = this.target.getCenterCoordinates();
    this.x2 = targetCenter.x;
    this.y2 = targetCenter.y;
  }

  private contextMenuRemove() {
    this.dataflowRemoveEdge(this);
  }

  private mounted() {
    this.updateCoordinates();

    TweenLite.from(this.$el, LONG_ANIMATION_DURATION_S, {
      opacity: 0,
    });
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
    const points = this.getArrowPoints(this.edgePathStr);
    return arrowPath(points.base, points.head);
  }

  private getArrowPoints(edgePath: string): { base: Point, head: Point } {
    const segments = edgePath.match(/[CLM]([\d.]+,?)+/g) as string[];
    let distance: number = 0;
    const xyCoords = segments.join('').split(/[CLM,]/g).map(val => +val)
      .slice(1); // remove the leading empty string from [CLM]
    const xCoords = xyCoords.filter((e: number, index: number) => index % 2 === 0);
    const yCoords = xyCoords.filter((e: number, index: number) => index % 2 === 1);
    if ((_.last(segments) as string)[0] === 'L') {
      const n = xCoords.length;
      const p1 = new Victor(xCoords[n - 2], yCoords[n - 2]);
      const p2 = new Victor(xCoords[n - 1], yCoords[n - 1]);
      distance += p1.distance(p2);
      if (distance >= ARROW_SIZE_PX) { // arrow should be drawn along the line from p1 to p2
        return {
          base: p1,
          head: p2,
        };
      }
      segments.pop();
      xCoords.pop();
      yCoords.pop();
    }
    xCoords.splice(0, xCoords.length - 4);
    yCoords.splice(0, yCoords.length - 4);
    const bezierCurve = (t: number, val: number[]) => {
      const ct = 1 - t;
      return ct * ct * ct * val[0] + t * t * t * val[3] + 3 * ct * t * (ct * val[1] + t * val[2]);
    };
    let lastPoint = new Victor(_.last(xCoords) as number, _.last(yCoords) as number);
    let p: number;
    const step = .01;
    for (p = 1 - step; p >= 0 && distance < ARROW_SIZE_PX; p -= step) {
      const point = new Victor(bezierCurve(p, xCoords), bezierCurve(p, yCoords));
      distance += point.distance(lastPoint);
      lastPoint = point;
    }
    const base = {
      x: bezierCurve(p, xCoords),
      y: bezierCurve(p, yCoords),
    };
    const baseVector = new Victor(base.x, base.y);
    const head = new Victor(_.last(xCoords) as number, _.last(yCoords) as number)
      .subtract(baseVector)
      .normalize()
      .multiplyScalar(ARROW_SIZE_PX)
      .add(baseVector);
    return {
      base,
      head,
    };
  }
}
