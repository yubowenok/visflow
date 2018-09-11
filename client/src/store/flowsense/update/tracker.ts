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
import { DataflowState, DiagramEventType } from '@/store/dataflow/types';
import store from '@/store';
import {
  compositeEvent,
  HistoryEvent,
  HistoryEventLevel,
} from '@/store/history/types';
import { showSystemMessage } from '@/common/util';
import { AutoLayoutResult } from '@/store/dataflow/layout';
import { autoLayout as dataflowAutoLayout } from '@/store/dataflow/layout';

const dataflow = (): DataflowState => store.state.dataflow;

export default class FlowsenseUpdateTracker {
  private createdNodes: Node[] = [];
  private createdEdges: Edge[] = [];
  private events: HistoryEvent[] = [];
  private eventIndexToCreatedNode: { [index: number]: Node } = {};
  private nodesToAutoLayout: Node[] = [];

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
    this.eventIndexToCreatedNode[this.events.length - 1] = node;
  }

  public createEdge(edge: Edge) {
    this.createdEdges.push(edge);
    this.events.push(dataflowHistory.createEdgeEvent(edge));
  }

  public getCreatedNodes(): Node[] {
    return this.createdNodes;
  }

  /**
   * Adds nodes for which layout needs adjustment.
   */
  public toAutoLayout(nodes: Node[]) {
    this.nodesToAutoLayout = _.uniq(this.nodesToAutoLayout.concat(nodes));
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
    // The options of the created nodes may have been changed.
    // Serialize the latest options into the node save.
    this.events.forEach((evt, eventIndex) => {
      if (evt.level === HistoryEventLevel.DIAGRAM && evt.type === DiagramEventType.CREATE_NODE) {
        evt.data.nodeSave = this.eventIndexToCreatedNode[eventIndex].serialize();
      }
    });

    const compositeEvt = compositeEvent('FlowSense: ' + message, this.events, {
      isNodeIcon: false,
      value: 'fas fa-keyboard',
    });
    store.commit('history/commit', compositeEvt);
  }

  /**
   * Layouts the diagram and commits all the changes to history.
   * This is done asynchronously because layouting is asynchronous.
   */
  public autoLayoutAndCommit(message: string) {
    // Queues the auto layout. The newly created nodes will be in the appear() transition in the beginning.
    // If auto layout is called too soon, two animations will collide and mess up the layout.
    setTimeout(() => dataflowAutoLayout(dataflow(), this.nodesToAutoLayout, result => {
      this.autoLayout(this.nodesToAutoLayout, result);
      this.commit(message);
    }), 0);
  }
}
