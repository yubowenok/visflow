import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Port from '../port/port';
import Edge from '../edge/edge';
import DrawingEdge from '../drawing-edge/drawing-edge';
import Visualization from '../visualization/visualization';
import { namespace } from 'vuex-class';
import { TweenLite } from 'gsap';
import $ from 'jquery';

import { DEFAULT_ANIMATION_DURATION_S } from '@/common/constants';

enum DragMode {
  PAN = 'pan',
  SELECT = 'select',
}

const interaction = namespace('interaction');
const dataflow = namespace('dataflow');

@Component({
  components: {
    Visualization,
    DrawingEdge,
  },
})
export default class DataflowCanvas extends Vue {
  @interaction.State('draggedPort') private draggedPort!: Port;
  @interaction.Getter('isAltPressed') private isAltPressed!: boolean;
  @interaction.Getter('isShiftPressed') private isShiftPressed!: boolean;
  @dataflow.Mutation('moveDiagram') private moveDiagram!: ({ dx, dy }: { dx: number, dy: number }) => void;

  private dragStart: JQuery.Coordinates = { left: 0, top: 0 };
  private isPanning = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  get dragMode(): DragMode {
    return this.isShiftPressed ? DragMode.SELECT : DragMode.PAN;
  }

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
    // $refs.edges is the background of the canvas.
    if (evt.target !== this.$refs.edges) {
      return;
    }
    if (this.dragMode === DragMode.PAN) {
      this.isPanning = true;
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
    } else if (this.dragMode === DragMode.SELECT) {

    }
    this.lastMouseX = evt.pageX;
    this.lastMouseY = evt.pageY;
  }

  private onMouseup(evt: JQuery.Event) {
    if (this.dragMode === DragMode.PAN) {
      this.isPanning = false;
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
