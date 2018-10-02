import { Vue, Component } from 'vue-property-decorator';
import $ from 'jquery';
import _ from 'lodash';

import ns from '@/store/namespaces';
import { HistoryLog } from '@/store/history/types';

@Component
export default class LogPanel extends Vue {
  @ns.panels.State('logPanelVisible') private isVisible!: boolean;
  @ns.history.State('currentLogIndex') private currentLogIndex!: number;
  @ns.history.Mutation('redoLog') private redoLog!: () => void;
  @ns.history.State('logs') private logs!: HistoryLog[];

  private mounted() {
    $(this.$el).resizable().draggable();
  }

  private printLog(log: HistoryLog) {
    console.log(_.omit(log, '__ob__'), _.omit(log.data, '__ob__'));
  }
}
