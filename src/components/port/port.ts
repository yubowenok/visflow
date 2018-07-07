import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Edge from '../edge/edge';
import PortPanel from '../port-panel/port-panel';
import $ from 'jquery';
import _ from 'lodash';

import ns from '@/common/namespaces';
import ContextMenu from '../context-menu/context-menu';

@Component({
  components: {
    PortPanel,
    ContextMenu,
  },
})
export default class Port extends Vue {
  public id!: string;
  public node!: Node;
  public isInput: boolean = false;
  public dataType: string = 'table';

  protected MAX_CONNECTIONS: number = 1;
  protected isActive: boolean = false;
  protected isAttachable: boolean = false;
  protected edges: Edge[] = [];

  @ns.interaction.Mutation('portDragStarted') private portDragStarted!: (port: Port) => void;
  @ns.interaction.Mutation('portDragged') private portDragged!: (coordinates: Point) => void;
  @ns.interaction.Mutation('portDragEnded') private portDragEnded!: (port: Port) => void;
  @ns.interaction.Mutation('dropPortOnPort') private dropPortOnPort!: (port: Port) => void;
  @ns.panels.Mutation('mountPortPanel') private mountPortPanel!: (panel: Vue) => void;
  @ns.contextMenu.Mutation('mount') private mountContextMenu!: (menu: ContextMenu) => void;
  @ns.dataflow.Mutation('disconnectPort') private disconnectPort!: (port: Port) => void;

  public hasCapacity(): boolean {
    return this.edges.length < this.MAX_CONNECTIONS;
  }

  /** Retrieves a list of nodes that this port connects to. */
  public getConnectedNodes(): Node[] {
    return this.edges.map(edge => this.isInput ? edge.source.node : edge.target.node);
  }

  /** Retrieves a list of ports that this port connects to. */
  public getConnectedPorts(): Port[] {
    return this.edges.map(edge => this.isInput ? edge.source : edge.target);
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
    return this.edges.concat();
  }

  /** Adds an edge to this port's incident list */
  public addIncidentEdge(edge: Edge) {
    this.edges.push(edge);
  }

  /** Removes an edge from this port's incident list */
  public removeIncidentEdge(edge: Edge) {
    _.pull(this.edges, edge);
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
