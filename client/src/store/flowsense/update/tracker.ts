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
import * as historyHelper from '@/store/history/helper';
import { DataflowState, DiagramEventType } from '@/store/dataflow/types';
import store from '@/store';
import {
  compositeEvent,
  HistoryEvent,
  HistoryEventLevel,
  HistoryNodeOptionEvent,
} from '@/store/history/types';
import { showSystemMessage } from '@/common/util';
import { AutoLayoutResult } from '@/store/dataflow/layout';
import { autoLayout as dataflowAutoLayout } from '@/store/dataflow/layout';
import { InjectedQuery } from '@/store/flowsense/helper';

const dataflow = (): DataflowState => store.state.dataflow;

const CENTER_CANVAS_DURATION_S = .5;

export default class FlowsenseUpdateTracker {
  private injectedQuery: string = '';
  private rawQuery: string = '';
  private createdNodes: Node[] = [];
  private removedNodes: Node[] = [];
  private createdEdges: Edge[] = [];
  private removedEdges: Edge[] = [];
  private events: HistoryEvent[] = [];
  private nodeOptionEvents: HistoryNodeOptionEvent[] = [];
  private eventIndexToCreatedNode: { [index: number]: Node } = {};
  private eventIndexToRemovedNode: { [index: number]: Node } = {};
  private nodesToAutoLayout: Node[] = [];
  private nodeToCenterAt: Node | null = null;
  private nodeToConnectToTarget: Node | null = null;

  constructor(query: InjectedQuery) {
    this.injectedQuery = query.query;
    this.rawQuery = query.rawQuery;
  }

  public createNode(node: Node) {
    this.createdNodes.push(node);
    this.events.push(dataflowHistory.createNodeEvent(node, dataflow().nodes));
    this.eventIndexToCreatedNode[this.events.length - 1] = node;
  }

  public removeNode(node: Node) {
    this.removedNodes.push(node);
    this.events.push(dataflowHistory.removeNodeEvent(node, dataflow().nodes));
    this.eventIndexToRemovedNode[this.events.length - 1] = node;
  }

  public createEdge(edge: Edge) {
    this.createdEdges.push(edge);
    this.events.push(dataflowHistory.createEdgeEvent(edge));
  }

  public removeEdge(edge: Edge) {
    this.removedEdges.push(edge);
    this.events.push(dataflowHistory.removeEdgeEvent(edge));
  }

  /**
   * Pushes a node option event to the event list.
   * The event has to be created by the caller.
   */
  public changeNodeOption(event: HistoryNodeOptionEvent) {
    this.events.push(event);
    this.nodeOptionEvents.push(event);
  }

  /**
   * Sets the node that should connect to target.
   */
  public setNodeToConnectToTarget(node: Node) {
    this.nodeToConnectToTarget = node;
  }

  public getNodeToConnectToTarget(): Node | null {
    return this.nodeToConnectToTarget;
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
   * Sets a node to center the canvas at. If the method is not called, the first node created is the one to center at.
   */
  public toCenterAt(node: Node) {
    this.nodeToCenterAt = node;
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
    for (const edge of this.removedEdges) {
      dataflowHelper.createEdge(dataflow(), edge.source, edge.target, false);
    }
    for (const optionEvt of this.nodeOptionEvents) {
      historyHelper.executeUndo(optionEvt); // undo the node option changes
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
    // [NOTE] Do not re-serialize the node's position as it may have been tracked by auto layout!
    // Serialize the latest options into the node save.
    // The anchor may also need to be updated because auto layout may change the relative position between the created
    // node and the anchor node.
    this.events.forEach((evt, eventIndex) => {
      if (evt.level === HistoryEventLevel.DIAGRAM && evt.type === DiagramEventType.CREATE_NODE) {
        const createdNode = this.eventIndexToCreatedNode[eventIndex];
        const keptSave = _.pick(evt.data.nodeSave, [
          'dataflowX',
          'dataflowY',
          'visModeX',
          'visModeY',
        ]);
        evt.data.nodeSave = _.extend(createdNode.serialize(), keptSave);
      }
    });

    const compositeEvt = compositeEvent('FlowSense: ' + message, this.events, {
      isNodeIcon: false,
      value: 'fas fa-keyboard',
    }, {
      injectedQuery: this.injectedQuery,
      rawQuery: this.rawQuery,
    });
    store.commit('history/commit', compositeEvt);
  }

  /**
   * Layouts the diagram and commits all the changes to history.
   * This is done asynchronously because layouting is asynchronous.
   */
  public autoLayoutAndCommit(message: string) {
    if (!this.nodesToAutoLayout.length) {
      // Layout is not affected, just center and commit.
      this.centerCanvas({}, () => {
        this.commit(message);
      });
      return;
    }
    // Queues the auto layout. The newly created nodes will be in the appear() transition in the beginning.
    // If auto layout is called too soon, two animations will collide and mess up the layout.
    setTimeout(() => dataflowAutoLayout(dataflow(), this.nodesToAutoLayout, {
      onComplete: (result, transitionDone) => {
        if (transitionDone) {
          this.centerCanvas(result, () => {
            this.commit(message);
          });
        }
      },
      noNodeMoving: true,
    }), 0);
  }

  /**
   * Selects all newly created nodes.
   */
  public selectCreatedNodes() {
    if (!this.createdNodes.length) {
      return; // Ignore for commands where no nodes are created.
    }
    dataflow().nodes.forEach(node => {
      if (this.createdNodes.indexOf(node) === -1) {
        node.deactivate();
        node.deselect();
      } else {
        node.select();
      }
    });
  }

  /**
   * Centers the canvas at nodeToCenterAt.
   */
  private centerCanvas(result: AutoLayoutResult, onComplete: () => void) {
    if (this.nodeToCenterAt === null && !this.createdNodes.length) {
      onComplete();
      return; // Nothing can be centered at.
    }
    const node = this.nodeToCenterAt || this.createdNodes[0];
    const nodeBox = node.getBoundingBox();
    // Position where the center node should be at.
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const newPosition = result[node.id] === undefined ?
      { x: nodeBox.x, y: nodeBox.y } : result[node.id].to;
    const dx = centerX - (newPosition.x + nodeBox.width / 2);
    const dy = centerY - (newPosition.y + nodeBox.height / 2);
    let movedCount = dataflow().nodes.length;
    const done = () => {
      if (--movedCount === 0) {
        onComplete();
      }
    };
    dataflow().nodes.forEach(diagramNode => {
      const box = diagramNode.getBoundingBox();
      const position = result[diagramNode.id] === undefined ?
        { x: box.x, y: box.y } : result[diagramNode.id].to;
      position.x += dx;
      position.y += dy;
      this.events.push(moveNodeEvent(diagramNode, [diagramNode], position, { x: box.x, y: box.y }));
      diagramNode.moveToWithTransition(position.x, position.y, CENTER_CANVAS_DURATION_S, done);
    });
  }
}
