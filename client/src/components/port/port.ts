import { Component, Vue, Watch } from 'vue-property-decorator';
import _ from 'lodash';
import $ from 'jquery';

import ns from '@/store/namespaces';
import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import PortPanel from '@/components/port-panel/port-panel';
import ContextMenu from '@/components/context-menu/context-menu';
import GlobalClick from '@/directives/global-click';
import Package from '@/data/package/package';

@Component({
  components: {
    PortPanel,
    ContextMenu,
  },
  directives: {
    GlobalClick,
  },
})
export default class Port extends Vue {
  public id!: string;
  public node!: Node;
  public isInput = false;

  protected DATA_TYPE = '';

  protected isMultiple = false;
  protected isActive = false;
  protected isAttachable = false;
  protected isConnectionChanged = false;
  protected edges: Edge[] = [];
  protected package: Package = new Package();

  @ns.interaction.Mutation('portDragStarted') private portDragStarted!: (port: Port) => void;
  @ns.interaction.Mutation('portDragged') private portDragged!: (coordinates: Point) => void;
  @ns.interaction.Mutation('portDragEnded') private portDragEnded!: (port: Port) => void;
  @ns.interaction.Mutation('dropPortOnPort') private dropPortOnPort!: (port: Port) => void;
  @ns.panels.Mutation('mountPortPanel') private mountPortPanel!: (panel: Vue) => void;
  @ns.contextMenu.Mutation('mount') private mountContextMenu!: (menu: ContextMenu) => void;
  @ns.dataflow.Mutation('disconnectPort') private disconnectPort!: (port: Port) => void;

  /**
   * Retrieves a list of nodes that this port connects to.
   * @abstract
   */
  public getConnectedNodes(): Node[] {
    console.error('using getConnectedNodes() of base class Port');
    return [];
  }

  /**
   * Retrieves a list of ports that this port connects to.
   * @abstract
   */
  public getConnectedPorts(): Port[] {
    console.error('using getConnectedPorts() of base class Port');
    return [];
  }

  public isConnected(): boolean {
    return this.edges.length > 0;
  }

  public isTypeMatched(port: Port): boolean {
    return this.DATA_TYPE === port.DATA_TYPE;
  }

  public hasCapacity(): boolean {
    return this.edges.length < this.maxConnections;
  }

  public updateCoordinates() {
    // also notify the incident edges to re-draw
    for (const edge of this.edges) {
      edge.updateCoordinates();
    }
  }

  public getCenterCoordinates(): Point {
    const $port = $(this.$refs.port);
    const offset = $port.offset() as JQuery.Coordinates;
    return {
      x: offset.left + ($port.width() as number) / 2,
      y: offset.top + ($port.height() as number) / 2,
    };
  }

  public getAllEdges(): Edge[] {
    return _.clone(this.edges);
  }

  /** Adds an edge to this port's incident list */
  public addIncidentEdge(edge: Edge) {
    this.edges.push(edge); // push() is wrapped by Vue, and is reactive
    this.isConnectionChanged = true;
  }

  /** Removes an edge from this port's incident list */
  public removeIncidentEdge(edge: Edge) {
    this.edges = _.clone(_.pull(this.edges, edge)); // _.pull is not reactive, do assignment
    this.isConnectionChanged = true;
  }

  /**
   * Sets or returns isUpdated.
   * @abstract
   */
  public isPackageUpdated(): boolean {
    console.error('using isPackageUpdated() of base class Port');
    return false;
  }

  /**
   * Checks if the port has a package.
   * @abstract
   */
  public hasPackage(): boolean {
    console.error('using hasPackage() of base class Port');
    return false;
  }

  /**
   * Retrieves the package the port carries.
   * @abstract
   */
  public getPackage(): Package {
    console.error('using getPackage() of base class Port');
    return new Package();
  }

  /** Checks if edges have been changed. */
  public isConnectionUpdated(): boolean {
    return this.isConnectionChanged;
  }

  /** Clears the connection changed flag. */
  public clearConnectionUpdate() {
    if (this.isConnectionChanged) {
      /**
       * Using a watcher is sensitive to Vue clock. The following implementation may fail to call onConnectionChange():
       *   @Watch('isConnectionChanged')
       *   private watchConnectionChanged() {
       *     this.onConnectionChange();
       *   }
       * This is because the watcher is executed on the next Vue tick. However, the isConnectionUpdated flag
       * could be cleared before the next tick, as propagation is synchronous.
       */
      this.onConnectionChange();
    }
    this.isConnectionChanged = false;
  }

  /** Generates a tooltip string for the port. */
  protected tooltip(): string {
    return 'no data';
  }

  protected get iconClasses(): string {
    return this.maxConnections === 1 ? 'fas fa-circle' : 'fas fa-caret-right';
  }

  protected onConnectionChange() {}

  protected get maxConnections(): number {
    return this.isMultiple ? Infinity : 1;
  }

  private activate() {
    this.isActive = true;
    this.node.deactivate(); // deactivate parent node to hide its option panel
    // Must use $nextTick because $refs.portPanel appears asynchronously after isActive becomes true.
    this.$nextTick(() => this.mountPortPanel(this.$refs.portPanel as Vue));
  }

  private deactivate() {
    this.isActive = false;
  }

  /** Removes all incident edges */
  private disconnect() {
    this.disconnectPort(this);
  }

  private mousedown(evt: Event) {
    if (this.isActive) {
      evt.stopPropagation();
    }
  }

  private clickLink() {
    console.log('link clicked', this.id);
  }

  private globalClick(evt: MouseEvent) {
    // If the click is on the port or on the port panel, do nothing.
    if ((this.$refs.port as Element).contains(evt.target as Element) ||
      this.$refs.portPanel && (this.$refs.portPanel as Vue).$el.contains(evt.target as Element)) {
      return;
    }
    this.deactivate();
  }

  private openContextMenu(evt: MouseEvent) {
    (this.$refs.contextMenu as ContextMenu).open(evt);
  }

  private mounted() {
    this.mountContextMenu(this.$refs.contextMenu as ContextMenu);

    const $port = $(this.$refs.port);
    $port.draggable({
      helper: () => $('<div></div>'),
      start: () => this.portDragStarted(this),
      drag: (evt_: Event) => {
        const evt: MouseEvent = evt_ as MouseEvent;
        this.portDragged({
          x: evt.pageX,
          y: evt.pageY,
        });
      },
      stop: () => this.portDragEnded(this),
    });

    $port.droppable({
      hoverClass: 'hover',
      tolerance: 'pointer',
      drop: (evt: Event, ui: JQueryUI.DroppableEventUIParam) => {
        if (ui.draggable.hasClass('port')) {
          this.dropPortOnPort(this);
        }
      },
    });
  }
}
