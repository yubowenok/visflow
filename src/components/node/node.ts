import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { TweenLite } from 'gsap';
import $ from 'jquery';
import _ from 'lodash';

import { getImgSrc } from '@/store/dataflow/node-types';
import { DEFAULT_ANIMATION_DURATION_S, PORT_SIZE_PX, ICONIZED_NODE_SIZE_PX } from '@/common/constants';
export { injectNodeTemplate } from './template';
import template from './node.html';
import ContextMenu from '../context-menu/context-menu';
import GlobalClick from '../../directives/global-click';
import NodeCover from './node-cover.vue';
import NodeLabel from './node-label.vue';
import OptionPanel from '../option-panel/option-panel';
import Edge from '../edge/edge';
import Port from '../port/port';
import MultiplePort from '../port/multiple-port';
import { MessageOptions } from '@/store/message';
import { checkEdgeConnectivity } from '@/store/dataflow';

const dataflow = namespace('dataflow');
const interaction = namespace('interaction');
const message = namespace('message');
const systemOptions = namespace('systemOptions');
const panels = namespace('panels');

const GRID_SIZE = 10;

@Component({
  components: {
    NodeLabel,
    NodeCover,
    ContextMenu,
    OptionPanel,
    Port,
  },
  directives: {
    GlobalClick,
  },
  template,
})
export default class Node extends Vue {
  public id!: string;
  public layer: number = 0;

  protected NODE_TYPE: string = 'node';
  protected DEFAULT_WIDTH: number = 50;
  protected DEFAULT_HEIGHT: number = 50;
  protected MIN_WIDTH: number = 30;
  protected MIN_HEIGHT: number = 30;

  protected RESIZABLE: boolean = false;

  protected label: string = '';

  // ports: input and output ports ids must be unique
  protected inputPorts: Port[] = [];
  protected outputPorts: Port[] = [];

  /** Maps port id to port. */
  protected portMap: { [id: string]: Port } = {};

  // layout
  // current width and height are dynamic
  protected width: number = 0; // initialized in created()
  protected height: number = 0; // initialized in created()
  protected displayWidth: number = 0; // width when not iconized
  protected displayHeight: number = 0; // height when not iconized
  protected x: number = 0; // css "left" of top-left corner
  protected y: number = 0; // css "top" of top-left corner
  protected isActive: boolean = false;
  protected isIconized: boolean = false;
  protected isInVisMode: boolean = false;
  protected isLabelVisible: boolean = false;

  /** A list of classes to be added to the container element so that CSS can take effect. */
  protected containerClasses: string[] = [this.NODE_TYPE];

  protected coverText: string = '';

  private isAnimating = false;

  get numInputPorts(): number {
    return this.inputPorts.length;
  }

  get numOutputPorts(): number {
    return this.outputPorts.length;
  }

  get optionPanelInitialState() {
    return {
      isIconized: this.isIconized,
      isInVisMode: this.isInVisMode,
      isLabelVisible: this.isLabelVisible,
    };
  }

  get getIconPath() {
    return getImgSrc(this.NODE_TYPE);
  }

  @dataflow.Getter('topNodeLayer') private topNodeLayer!: number;
  @dataflow.Mutation('incrementNodeLayer') private incrementNodeLayer!: () => void;
  @dataflow.Mutation('removeNode') private dataflowRemoveNode!: (node: Node) => void;
  @interaction.Mutation('dropPortOnNode') private dropPortOnNode!: (node: Node) => void;
  @message.Mutation('showMessage') private showMessage!: (options: MessageOptions) => void;
  @systemOptions.State('nodeLabelsVisible') private nodeLabelsVisible!: boolean;
  @panels.Mutation('mountOptionPanel') private mountOptionPanel!: (panel: Vue) => void;

  public findConnectablePort(port: Port): Port | null {
    // TODO: do not check connectivity. Just return the first input/output port.
    if (port.isInput) {
      for (const output of this.outputPorts) {
        const connectivity = checkEdgeConnectivity(output, port);
        if (connectivity.connectable) {
          return output;
        }
      }
    } else {
      for (const input of this.inputPorts) {
        const connectivity = checkEdgeConnectivity(port, input);
        if (connectivity.connectable) {
          return input;
        }
      }
    }
    return null;
  }

  /** Retrieves the ids of the nodes that this node connects to via output ports. */
  public getOutputNodes(): Node[] {
    const nodes: Set<Node> = new Set();
    for (const port of this.outputPorts) {
      const outputs = port.getConnectedNodes();
      for (const node of outputs) {
        nodes.add(node);
      }
    }
    return Array.from(nodes);
  }

  public getBoundingBox(): Box {
    const $node = $(this.$refs.node);
    const w = $node.width() as number;
    const h = $node.height() as number;
    const offset = $node.offset() as JQueryCoordinates;
    return {
      x: offset.left,
      y: offset.top,
      w,
      h,
    };
  }

  /** Makes the node activated. This is typically auto-triggered by mouse click on the node. */
  public activate() {
    this.isActive = true;
    // Must use $nextTick because $refs.optionPanel appears asynchronously after isActive becomes true.
    this.$nextTick(() => this.mountOptionPanel(this.$refs.optionPanel as Vue));
  }

  /** Makes the node deactivated. This is typically auto-triggered by clicking outside the node. */
  public deactivate() {
    this.isActive = false;
  }

  public getAllEdges(): Edge[] {
    let edges: Edge[] = [];
    _.each(this.portMap, port => {
      edges = edges.concat(port.getAllEdges());
    });
    return edges;
  }

  protected created() {
    this.label = this.id;
    this.width = this.displayWidth = this.DEFAULT_WIDTH;
    this.height = this.displayHeight = this.DEFAULT_HEIGHT;

    this.createPorts();
    this.createPortMap();
  }

  protected createPorts() {
    this.inputPorts = [
      new Port({
        data: {
          id: 'in',
          node: this,
          isInput: true,
        },
        store: this.$store,
      }),
    ];
    this.outputPorts = [
      new MultiplePort({
        data: {
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  /**
   * We make mounted() private so that inheriting class cannot add mounted behavior.
   * Though vue supports all mounted() to be called sequentially, any inheriting class should update their
   * type-specific data and properties in created() rather than mounted().
   * ExtendedNode.created() is called before Node.mounted(), so that the updates can take effect
   * before we set up things here.
   */
  private mounted() {
    this.isActive = true;
    this.initDragAndResize();
    this.initDrop();
    this.initCss();
    this.mountPorts();
    this.appear(); // animate node appearance
  }

  /** Creates a mapping from port id to port component. */
  private createPortMap() {
    this.inputPorts.forEach(port => {
      this.portMap[port.id] = port;
    });
    this.outputPorts.forEach(port => {
      this.portMap[port.id] = port;
    });
  }

  /** Update the ports' coordinates when the node moves. */
  private updatePortCoordinates() {
    _.each(this.portMap, (port: Port) => {
      port.updateCoordinates();
    });
  }

  private initDragAndResize() {
    const $node = $(this.$refs.node);
    let lastDragPosition: { left: number, top: number };

    const updatePorts = () => {
      // Port coordinates are Vue reactive and async.
      // We must update coordinates till Vue updates the ports.
      this.$nextTick(this.updatePortCoordinates);
    };

    $node.draggable({
      grid: [GRID_SIZE, GRID_SIZE],
      start: (evt: Event, ui: JQueryUI.DraggableEventUIParams) => {
        lastDragPosition = ui.position;
      },
      drag: (evt: Event, ui: JQueryUI.DraggableEventUIParams) => {
        if (ui.position.left !== lastDragPosition.left ||
            ui.position.top !== lastDragPosition.top) {
          lastDragPosition.left = ui.position.left;
          lastDragPosition.top = ui.position.top;

          this.x = ui.position.left;
          this.y = ui.position.top;
          updatePorts();
        }
      },
      stop: (evt: Event, ui: JQueryUI.DraggableEventUIParams) => {
        this.x = ui.position.left;
        this.y = ui.position.top;
        updatePorts();
      },
    });

    if (this.RESIZABLE) {
      $node.resizable({
        handles: 'all',
        grid: GRID_SIZE,
        minWidth: this.MIN_WIDTH,
        minHeight: this.MIN_HEIGHT,
        resize: (evt: Event, ui: JQueryUI.ResizableUIParams) => {
          this.width = this.displayWidth = ui.size.width;
          this.height = this.displayHeight = ui.size.height;
          this.x = ui.position.left;
          this.y = ui.position.top;
          updatePorts();
        },
      });
    }
  }

  private initDrop() {
    // Ports can be dropped on nodes to create an edge.
    $(this.$refs.content).droppable({
      /**
       * General note on using jquery callback within vue components:
       * "this" of the callback function is the Vue component.
       * If we add console.log(this) in the callback function, it may print the Vue component.
       * However in chrome debugger console if we set a breakpoint and use the debugger console to print "this",
       * the DOM element may be incorrectly printed.
       */
      drop: (evt: Event, ui: JQueryUI.DroppableEventUIParam) => {
        if (ui.draggable.hasClass('port')) {
          this.dropPortOnNode(this);
        }
      },
    });
  }

  private mountPorts() {
    const $node = $(this.$refs.node);
    _.each(this.portMap, (port: Port) => {
      const container = $node.find(`#port-container-${port.id}`);
      port.$mount();
      container.append(port.$el);
    });
  }

  private initCss() {
    const $node = $(this.$refs.node);
    // Note: When the node is created and initialized, the passed in x and y are coordinates for the center,
    // not the top-left corner.
    this.x -= this.DEFAULT_WIDTH / 2;
    this.y -= this.DEFAULT_HEIGHT / 2;
    $node.addClass(this.containerClasses)
      .attr({
        id: this.id,
      })
      .css({
        width: this.DEFAULT_WIDTH,
        height: this.DEFAULT_HEIGHT,
        left: this.x,
        top: this.y,
        // jQuery.draggable sets position to relative, we override here.
        position: 'absolute',
      });
  }

  private appear() {
    TweenLite.from(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      scale: 1.5,
    });
  }

  private contextMenuRemove() {
    this.dataflowRemoveNode(this);
  }

  private clicked() {
    this.activate();
    this.$nextTick(() => this.mountOptionPanel(this.$refs.optionsPanel as Vue));
  }

  private globalClick(evt: MouseEvent) {
    // If the click is on the node or its option panel, do nothing.
    if (this.$el.contains(evt.target as Element) ||
      this.$refs.optionPanel && (this.$refs.optionPanel as Vue).$el.contains(evt.target as Element)) {
      return;
    }
    this.deactivate();
  }

  private onToggleIconized(val: boolean) {
    this.isIconized = val;
  }

  private onToggleInVisMode(val: boolean) {
    this.isInVisMode = val;
  }

  private onToggleLabelVisible(val: boolean) {
    this.isLabelVisible = val;
  }

  @Watch('isIconized')
  private onIconizedChange() {
    let newWidth: number;
    let newHeight: number;
    if (this.isIconized) {
      this.displayWidth = this.width;
      this.displayHeight = this.height;
      newWidth = newHeight = ICONIZED_NODE_SIZE_PX;
      if (this.RESIZABLE) {
        $(this.$refs.node).resizable('disable');
      }
    } else {
      newWidth = this.displayWidth;
      newHeight = this.displayHeight;
      if (this.RESIZABLE) {
        $(this.$refs.node).resizable('enable');
      }
    }
    const targetX = this.x + this.width / 2 - newWidth / 2;
    const targetY = this.y + this.height / 2 - newHeight / 2;
    const $node = $(this.$refs.node);
    this.isAnimating = true;
    TweenLite.to(this.$refs.node, DEFAULT_ANIMATION_DURATION_S, {
      width: newWidth,
      height: newHeight,
      left: targetX,
      top: targetY,
      onUpdate: () => {
        this.width = $node.width() as number;
        this.height = $node.height() as number;
        const offset = $node.offset() as JQuery.Coordinates;
        this.x = offset.left;
        this.y = offset.top;
      },
      onComplete: () => {
        this.width = newWidth;
        this.height = newHeight;
        this.isAnimating = false;
      },
    });
  }

  @Watch('isActive')
  private onActivatedChange(newVal: boolean) {
    if (newVal) {
      this.incrementNodeLayer();
      this.layer = this.topNodeLayer;
    }
  }

  @Watch('layer')
  private onLayerChange(newLayer: number) {
    $(this.$refs.node).css('z-index', this.layer);
  }

  /** Sets the locations of ports. */
  private portStyles(port: Port, index: number, isInputPort: boolean): { left: string, top: string } {
    return {
      left: (isInputPort ? -PORT_SIZE_PX : this.width) + 'px',
      top: ((index - .5) * PORT_SIZE_PX + this.height / 2) + 'px',
    };
  }
}
