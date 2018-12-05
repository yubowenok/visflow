import { Component, Vue } from 'vue-property-decorator';
import VueRouter from 'vue-router';
import $ from 'jquery';
import '@/common/jquery-ui';

import ns from '@/store/namespaces';
import AppHeader from '@/components/app-header/app-header';
import AppModals from './app-modals/app-modals';
import SystemMessage from '@/components/system-message/system-message';
import ContextMenu from '@/components/context-menu/context-menu';
import NodePanel from '@/components/node-panel/node-panel';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import QuickNodePanel from '@/components/quick-node-panel/quick-node-panel';
import HistoryPanel from '@/components/history-panel/history-panel';
import LogPanel from '@/components/log-panel/log-panel';
import FlowsenseInput from '@/components/flowsense-input/flowsense-input';
import { systemMessageErrorHandler } from '@/common/util';

@Component({
  components: {
    AppHeader,
    SystemMessage,
    ContextMenu,
    NodePanel,
    QuickNodePanel,
    HistoryPanel,
    LogPanel,
    DataflowCanvas,
    AppModals,
    FlowsenseInput,
  },
})
export default class App extends Vue {
  @ns.dataflow.Mutation('setCanvas') private setCanvas!: (canvas: Vue) => void;
  @ns.dataflow.Action('loadDiagram') private dispatchLoadDiagram!: (filename: string) => Promise<string>;
  @ns.history.Action('loadLog') private dispatchLoadLog!: (filename: string) => Promise<object[]>;
  @ns.panels.Mutation('setOptionPanelMount') private setOptionPanelMount!: (mount: Vue) => void;
  @ns.panels.Mutation('setPortPanelMount') private setPortPanelMount!: (mount: Vue) => void;
  @ns.panels.Mutation('openQuickNodePanel') private openQuickNodePanel!: () => void;
  @ns.panels.Mutation('openLogPanel') private openLogPanel!: () => void;
  @ns.modals.Mutation('setNodeModalMount') private setNodeModalMount!: (mount: Vue) => void;
  @ns.modals.Mutation('openExperimentModal') private openExperimentModal!: () => void;
  @ns.contextMenu.Mutation('setMount') private setContextMenuMount!: (mount: Vue) => void;
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;
  @ns.interaction.Mutation('keydown') private interactionKeydown!: (evt: JQuery.Event) => void;
  @ns.interaction.Mutation('keyup') private interactionKeyup!: (evt: JQuery.Event) => void;
  @ns.interaction.Mutation('mousedown') private interactionMousedown!: () => void;
  @ns.interaction.Mutation('mouseup') private interactionMouseup!: () => void;
  @ns.interaction.Mutation('mousemove') private interactionMousemove!: () => void;
  @ns.router.Mutation('setRouter') private setRouter!: (router: VueRouter) => void;
  @ns.flowsense.Mutation('openInput') private openFlowsenseInput!: (noActivePosition?: boolean) => void;
  @ns.flowsense.State('enabled') private isFlowsenseEnabled!: boolean;
  @ns.experiment.Action('login') private loginExperimentUser!: () => Promise<void>;
  @ns.experiment.Action('load') private dispatchLoadExperiment!: (filename: string) => Promise<void>;
  @ns.experiment.Getter('isInExperiment') private isInExperiment!: boolean;
  @ns.user.Action('logout') private dispatchLogout!: () => void;
  @ns.systemOptions.Mutation('toggleBetaFeatures') private toggleBetaFeatures!: (value?: boolean) => void;

  private created() {
    this.setRouter(this.$router);
  }

  private mounted() {
    this.setCanvas(this.$refs.dataflowCanvas as Vue);
    this.setOptionPanelMount(this.$refs.optionPanelMount as Vue);
    this.setPortPanelMount(this.$refs.portPanelMount as Vue);
    this.setContextMenuMount(this.$refs.contextMenuMount as Vue);
    this.setNodeModalMount(this.$refs.nodeModalMount as Vue);

    this.initKeyHandlers();

    // This is an experiment.
    // Display the consent form modal and prepare to launch a new experiment.
    if (this.$route.name === 'experiment' || this.$route.name === 'load-experiment') {
      this.toggleBetaFeatures(false);
      this.openExperimentModal();
      this.loginExperimentUser().then(() => {
        if (this.$route.name === 'load-experiment') {
          this.dispatchLoadExperiment(this.$route.params.filename)
            .catch(systemMessageErrorHandler(this.$store));
        }
      });
    } else if (this.isInExperiment) {
      this.dispatchLogout();
    }

    // On page load check if we need to load diagram history logs.
    if (this.$route.name === 'log') {
      this.dispatchLoadDiagram(this.$route.params.filename)
        .then(() => {
          this.dispatchLoadLog(this.$route.params.filename)
            .then(() => this.openLogPanel())
            .catch(systemMessageErrorHandler(this.$store));
        })
        .catch(systemMessageErrorHandler(this.$store));
    }

    // On page load check if we need to load diagram.
    if (this.$route.name === 'diagram') {
      this.dispatchLoadDiagram(this.$route.params.filename)
        .catch(systemMessageErrorHandler(this.$store));
    }
  }

  /** Adds event handlers to global keystrokes. */
  private initKeyHandlers() {
    $(document)
      .keydown(this.onKeydown)
      .keyup(this.onKeyup)
      .mousedown(this.onMousedown)
      .mouseup(this.onMouseup)
      .mousemove(this.onMousemove);
  }

  private removeKeyHandlers() {
    $(document)
      .off('keydown', this.onKeydown)
      .off('keyup', this.onKeyup);
  }

  private onKeydown(evt: JQuery.Event) {
    // On initial mouse click, form-control keydown event (from modal) may be bubbled up without key value set.
    // The reason for !evt.key is unknown. We ignore event with falsy evt.key.
    if (!evt.key || $(evt.target).is('input, textarea, *[contenteditable=true]')) {
      return;
    }
    this.interactionKeydown(evt);
  }

  private onKeyup(evt: JQuery.Event) {
    if (!evt.key || $(evt.target).is('input, textarea, *[contenteditable=true]')) {
      return;
    }
    this.interactionKeyup(evt);
  }

  private onMousedown(evt: JQuery.Event) {
    this.interactionMousedown();
  }

  private onMouseup(evt: JQuery.Event) {
    this.interactionMouseup();
  }

  private onMousemove(evt: JQuery.Event) {
    // this.interactionMousemove();
  }

  private addNode() {
    this.openQuickNodePanel();
  }

  private beforeDestroy() {
    this.removeKeyHandlers();
  }
}
