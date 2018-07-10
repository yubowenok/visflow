import { Component, Vue } from 'vue-property-decorator';
import { TweenLite } from 'gsap';
import $ from 'jquery';

import ns from '@/store/namespaces';
import Node from '@/components/node/node';
import Port from '@/components/port/port';
import Edge from '@/components/edge/edge';
import DrawingEdge from '@/components/drawing-edge/drawing-edge';
import Visualization from '@/components/visualization/visualization';
import { DEFAULT_ANIMATION_DURATION_S } from '@/common/constants';

enum DragMode {
  NONE = 'none',
  PAN = 'pan',
  SELECT = 'select',
}
@Component({
  components: {
    Visualization,
    DrawingEdge,
  },
})
export default class DataflowCanvas extends Vue {
  @ns.interaction.State('draggedPort') private draggedPort!: Port;
  @ns.interaction.Getter('isAltPressed') private isAltPressed!: boolean;
  @ns.interaction.Getter('isShiftPressed') private isShiftPressed!: boolean;
  @ns.interaction.Mutation('clickBackground') private clickBackground!: () => void;
  @ns.dataflow.Mutation('moveDiagram') private moveDiagram!: ({ dx, dy }: { dx: number, dy: number }) => void;

  private dragStart: JQuery.Coordinates = { left: 0, top: 0 };
  private isPanning = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private draggedDistance: number = 0;
  private dragMode: DragMode = DragMode.NONE;

  get dragClass(): string {
    return this.isPanning ? 'panning' : '';
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

    if (this.dragMode === DragMode.PAN) {
      this.isPanning = true;
      this.draggedDistance = 0;
    } else if (this.dragMode === DragMode.SELECT) {

    }
    this.lastMouseX = evt.pageX;
    this.lastMouseY = evt.pageY;
  }

  private onMousemove(evt: JQuery.Event) {
    if (this.dragMode === DragMode.PAN && this.isPanning) {
      const dx = evt.pageX - this.lastMouseX;
      const dy = evt.pageY - this.lastMouseY;
      this.moveDiagram({ dx, dy });
      this.draggedDistance += Math.abs(dx) + Math.abs(dy);
    } else if (this.dragMode === DragMode.SELECT) {

    }
    this.lastMouseX = evt.pageX;
    this.lastMouseY = evt.pageY;
  }

  private onMouseup(evt: JQuery.Event) {
    if (this.dragMode === DragMode.PAN) {
      this.isPanning = false;
      if (this.draggedDistance === 0) {
        // Click on the background deselects all selected nodes.
        this.clickBackground();
      }
    } else if (this.dragMode === DragMode.SELECT) {
    }
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
}
