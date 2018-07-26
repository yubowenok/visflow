import { Component, Vue, Watch } from 'vue-property-decorator';
import { TweenLite } from 'gsap';
import $ from 'jquery';

import ns from '@/store/namespaces';
import Node from '@/components/node/node';
import Port from '@/components/port/port';
import Edge from '@/components/edge/edge';
import DrawingEdge from '@/components/drawing-edge/drawing-edge';
import { DEFAULT_ANIMATION_DURATION_S } from '@/common/constants';
import * as history from './history';
import { HistoryDiagramEvent } from '@/store/history/types';

enum DragMode {
  NONE = 'none',
  PAN = 'pan',
  SELECT = 'select',
}

@Component({
  components: {
    DrawingEdge,
  },
})
export default class DataflowCanvas extends Vue {
  @ns.interaction.State('draggedPort') private draggedPort!: Port;
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;
  @ns.interaction.Getter('isAltPressed') private isAltPressed!: boolean;
  @ns.interaction.Getter('isShiftPressed') private isShiftPressed!: boolean;
  @ns.interaction.Mutation('clickBackground') private clickBackground!: () => void;
  @ns.interaction.Mutation('trackMouseMove') private trackMouseMove!: (point: Point) => void;
  @ns.interaction.Mutation('selectNodesInBoxOnCanvas') private selectNodesInBoxOnCanvas!: (box: Box) => void;
  @ns.dataflow.Mutation('moveDiagram') private moveDiagram!: ({ dx, dy }: { dx: number, dy: number }) => void;
  @ns.history.Mutation('commit') private commitHistory!: (evt: HistoryDiagramEvent) => void;

  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private draggedDistance: number = 0;
  private dragStartPoint: Point = { x: 0, y: 0 };
  private dragEndPoint: Point = { x: 0, y: 0 };
  private dragMode: DragMode = DragMode.NONE;

  get dragClass(): string {
    return this.dragMode === DragMode.PAN || this.isAltPressed ? 'panning' : '';
  }

  get selectBox(): Box {
    const xl = Math.min(this.dragStartPoint.x, this.dragEndPoint.x);
    const xr = Math.max(this.dragStartPoint.x, this.dragEndPoint.x);
    const yl = Math.min(this.dragStartPoint.y, this.dragEndPoint.y);
    const yr = Math.max(this.dragStartPoint.y, this.dragEndPoint.y);
    return {
      x: xl,
      y: yl,
      width: xr - xl,
      height: yr - yl,
    };
  }

  get selectBoxStyle() {
    const box = this.selectBox;
    return {
      left: box.x + 'px',
      top: box.y + 'px',
      width: box.width + 'px',
      height: box.height + 'px',
    };
  }

  public addNode(node: Node) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }

  public removeNode(node: Node, callback?: () => void) {
    // First deactivate node so that its option panel will hide and be unmounted from the option panel mount.
    // Unmount is handled by Vue element visibility.
    node.deactivate();

    TweenLite.to(node.$el, DEFAULT_ANIMATION_DURATION_S, {
      opacity: 0,
      onComplete: () => {
        (this.$refs.nodes as Element).removeChild(node.$el);
        if (callback) {
          callback();
        }
      },
    });
  }

  /**
   * Adds an edge to the canvas. Each edge consists of one svg <g> element and one context menu, nested under a <div>.
   * The <g> element is appended to the edge svg, and the container <div> is mounted to "edgeMount".
   */
  public addEdge(edge: Edge) {
    edge.$mount();
    (this.$refs.edgeMount as Element).appendChild(edge.$el);
    (this.$refs.edges as Element).appendChild(edge.getEdgeSvgNode());
  }

  public removeEdge(edge: Edge, callback?: () => void) {
    (this.$refs.edgeMount as Element).removeChild(edge.$el);
    TweenLite.to(edge.getEdgeSvgNode(), DEFAULT_ANIMATION_DURATION_S, {
      opacity: 0,
      onComplete: () => {
        (this.$refs.edges as Element).removeChild(edge.getEdgeSvgNode());
        if (callback) {
          callback();
        }
      },
    });
  }

  private onMousedown(evt: JQuery.Event) {
    // $refs.edges is the background of the canvas that is responsive to mouse clicks.
    if (evt.target !== this.$refs.edges ||
      evt.button !== 0) { // Respond only to left click (button = 0).
      this.dragMode = DragMode.NONE;
      return;
    }

    this.dragMode = this.isShiftPressed ? DragMode.SELECT : DragMode.PAN;
    this.dragStartPoint = this.dragEndPoint = { x: evt.pageX, y: evt.pageY };

    if (this.dragMode === DragMode.PAN) {
      this.draggedDistance = 0;
    } else if (this.dragMode === DragMode.SELECT) {
    }
    this.lastMouseX = evt.pageX;
    this.lastMouseY = evt.pageY;
    evt.preventDefault();
  }

  private onMousemove(evt: JQuery.Event) {
    if (this.dragMode === DragMode.NONE) {
      return;
    }
    this.dragEndPoint = { x: evt.pageX, y: evt.pageY };
    if (this.dragMode === DragMode.PAN) {
      const dx = evt.pageX - this.lastMouseX;
      const dy = evt.pageY - this.lastMouseY;
      this.moveDiagram({ dx, dy });
      this.draggedDistance += Math.abs(dx) + Math.abs(dy);
    } else if (this.dragMode === DragMode.SELECT) {
    }
    this.lastMouseX = evt.pageX;
    this.lastMouseY = evt.pageY;
    this.trackMouseMove({ x: this.lastMouseX, y: this.lastMouseY });
  }

  private onMouseup(evt: JQuery.Event) {
    if (this.dragMode === DragMode.NONE) {
      return;
    }
    if (this.dragMode === DragMode.PAN) {
      if (this.draggedDistance === 0) {
        // Click on the background deselects all selected nodes.
        this.clickBackground();
      } else {
        this.commitHistory(history.panningEvent(this.dragEndPoint, this.dragStartPoint));
      }
    } else if (this.dragMode === DragMode.SELECT) {
      this.selectNodesInBoxOnCanvas(this.selectBox);
    }
    this.dragMode = DragMode.NONE;
    this.dragEndPoint = this.dragStartPoint = { x: 0, y: 0 };
  }

  private initDrag() {
    $(this.$el)
      .mousedown(this.onMousedown)
      .mousemove(this.onMousemove)
      .mouseup(this.onMouseup);
  }

  private removeDrag() {
    $(this.$el)
      .off('mousedown', this.onMousedown)
      .off('mousemove', this.onMousemove)
      .off('mouseup', this.onMouseup);
  }

  private mounted() {
    this.initDrag();
  }

  private beforeDestroy() {
    this.removeDrag();
  }

  @Watch('isSystemInVisMode')
  private onVisModeChange(isSystemInVisMode: boolean) {
    if (isSystemInVisMode) {
      TweenLite.to(this.$refs.edges, DEFAULT_ANIMATION_DURATION_S, {
        opacity: 0,
      });
    } else {
      TweenLite.to(this.$refs.edges, DEFAULT_ANIMATION_DURATION_S, {
        opacity: 1,
      });
    }
  }
}
