/**
 * @fileoverview Provides an update tracker class that records all the diagram changes. The tracker supports history
 * generation and rewinding operations on error.
 */

import _ from 'lodash';
import { Node } from '@/components/node';
import { moveNodeEvent } from '@/components/node/history';
import Edge from '@/components/edge/edge';
import * as dataflowHistory from '@/store/dataflow/history';
import * as dataflowHelper from '@/store/dataflow/helper';
import { DataflowState } from '@/store/dataflow/types';
import store from '@/store';
import {
  HistoryDiagramEvent,
  diagramBatchEvent,
  HistoryNodeEvent,
  compositeEvent,
  HistoryEvent,
} from '@/store/history/types';
import { showSystemMessage } from '@/common/util';
import { AutoLayoutResult } from '@/store/dataflow/layout';

const dataflow = (): DataflowState => store.state.dataflow;

export default class FlowsenseUpdateTracker {
  private createdNodes: Node[] = [];
  private createdEdges: Edge[] = [];
  private events: HistoryEvent[] = [];

  /**
   * Generates node movement event based on auto layout result.
   */
  public autoLayout(nodes: Node[], result: AutoLayoutResult) {
    nodes.forEach(node => {
      const { from, to } = result[node.id];
      this.events.push(moveNodeEvent(node, [node], to, from));
    });
  }

  public createNode(node: Node) {
    this.createdNodes.push(node);
    this.events.push(dataflowHistory.createNodeEvent(node, dataflow().nodes));
  }

  public createEdge(edge: Edge) {
    this.createdEdges.push(edge);
    this.events.push(dataflowHistory.createEdgeEvent(edge));
  }

  /**
   * Cancels all operations. Created nodes/edge are removed. Optionally displays a warn message.
   */
  public cancel(message?: string) {
    for (const node of this.createdNodes) {
      dataflowHelper.removeNode(dataflow(), node, false);
    }
    for (const edge of this.createdEdges) {
      dataflowHelper.removeEdge(dataflow(), edge, false);
    }
    if (message !== undefined) {
      showSystemMessage(store, message, 'warn');
    }
  }

  /**
   * Commits the diagram changes to system history.
   */
  public commit(message: string) {
    const event = compositeEvent('FlowSense: ' + message, this.events, {
      isNodeIcon: false,
      value: 'fas fa-keyboard',
    });
    store.commit('history/commit', event);
  }
}
