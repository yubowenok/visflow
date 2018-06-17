import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Edge from '../edge/edge';
import $ from 'jquery';
import { namespace } from 'vuex-class';
const interaction = namespace('interaction');
const dataflow = namespace('dataflow');

@Component
export default class Port extends Vue {
  public id!: string;
  public node!: Node;
  public isInput: boolean = false;

  protected edges: Edge[] = [];

  @interaction.Mutation('portDragStarted') private portDragStarted!: (port: Port) => void;
  @interaction.Mutation('portDragged') private portDragged!: (coordinates: Point) => void;
  @interaction.Mutation('portDragEnded') private portDragEnded!: (port: Port) => void;
  @interaction.Mutation('dropPortOnPort') private dropPortOnPort!: (port: Port) => void;

  public updateCoordinates() {
    // also notify the incident edges to re-draw
    for (const edge of this.edges) {
      edge.updateCoordinates();
    }
  }

  public addEdge(edge: Edge) {
    this.edges.push(edge);
  }

  public getCenterCoordinates(): Point {
    const $port = $(this.$el);
    const offset = $port.offset() as JQuery.Coordinates;
    return {
      x: offset.left + ($port.width() as number) / 2,
      y: offset.top + ($port.height() as number) / 2,
    };
  }

  private mounted() {
    const $el = $(this.$el);
    $el.draggable({
      helper: () => $('<div></div>'),
      start: () => {
        this.portDragStarted(this);
      },
      drag: (evt_: Event) => {
        const evt: MouseEvent = evt_ as MouseEvent;
        this.portDragged({
          x: evt.pageX,
          y: evt.pageY,
        });
      },
      stop: () => this.portDragEnded(this),
    });

    $el.droppable({
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
