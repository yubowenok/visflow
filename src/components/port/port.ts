import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import $ from 'jquery';
import { namespace } from 'vuex-class';
const interaction = namespace('interaction');
const dataflow = namespace('dataflow');

@Component
export default class Port extends Vue {
  public id!: string;
  protected node!: Node;

  protected isInput: boolean = false;

  @interaction.Mutation('portDragStarted') private portDragStarted!: (port: Port) => void;
  @interaction.Mutation('portDragged') private portDragged!: (coordinates: { x: number, y: number }) => void;
  @interaction.Mutation('portDragEnded') private portDragEnded!: (port: Port) => void;
  @interaction.Mutation('dropPortOnPort') private dropPortOnPort!: (port: Port) => void;

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
