import { Vue, Component } from 'vue-property-decorator';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';

import ns from '@/store/namespaces';
import { HistoryLog } from '@/store/history/types';

@Component
export default class LogPanel extends Vue {
  @ns.panels.State('logPanelVisible') private isVisible!: boolean;
  @ns.panels.Mutation('closeLogPanel') private closeLogPanel!: () => void;
  @ns.history.State('currentLogIndex') private currentLogIndex!: number;
  @ns.history.Mutation('redoLog') private redoLog!: () => void;
  @ns.history.State('logs') private logs!: HistoryLog[];
  @ns.dataflow.Action('loadDiagram') private dispatchLoadDiagram!: (filename: string) => Promise<string>;

  private mounted() {
    $(this.$el).resizable().draggable();
  }

  private formatLogTime(timestamp: number): string {
    return moment(timestamp).format('MM/DD/YY hh:mm:ss');
  }

  private loadDiagram() {
    this.closeLogPanel();
    this.dispatchLoadDiagram(this.$route.params.filename);
  }

  private printLog(log: HistoryLog) {
    console.log(`[${this.formatLogTime(log.timestamp)} :${log.type}]`, _.omit(log.data, '__ob__'));
  }
}
