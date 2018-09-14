import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue } from '../types';
import FlowsenseUpdateTracker from './tracker';
import Edge from '@/components/edge/edge';
import SetOperator, { SetOperatorMode } from '@/components/set-operator/set-operator';
import { SubsetNode } from '@/components/subset-node';
import VisualEditor, { VisualEditorMode } from '@/components/visual-editor/visual-editor';
import { Visualization } from '@/components/visualization';

const HIGHLIGHT_OFFSET_PX = 50;

/**
 * Creates a subdiagram for highlighting selection.
 */
export const createHighlightSubdiagram = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                                          sources: QuerySource[], targets: QueryTarget[]) => {
  const union = util.createNode(util.getCreateNodeOptions('set-operator',
    { offsetX: HIGHLIGHT_OFFSET_PX, offsetY: HIGHLIGHT_OFFSET_PX }),
    { mode: SetOperatorMode.UNION }) as SetOperator;
  tracker.createNode(union);

  const visualEditor = util.createNode(util.getCreateNodeOptions('visual-editor',
    { offsetX: HIGHLIGHT_OFFSET_PX, offsetY: -HIGHLIGHT_OFFSET_PX }),
    {
      mode: VisualEditorMode.ASSIGNMENT,
      visuals: {
        color: 'darkred',
      },
    }) as VisualEditor;
  tracker.createNode(visualEditor);

  const sourceNode = sources[0].node;

  if (!(sourceNode as Visualization).isVisualization) {
    tracker.cancel('cannot highlight a non-visualization node');
    return;
  }

  // Connect data to union before the selection (otherwise data's visuals will be inherited).
  const dataPort = (sourceNode as SubsetNode).getSubsetOutputPort();
  if (!dataPort) {
    tracker.cancel(`node ${sourceNode.getLabel()} does not have connectable data output port`);
    return;
  }
  const edgeDataToUnion = util.createEdge(dataPort, union.getSubsetInputPort(), false) as Edge;
  tracker.createEdge(edgeDataToUnion);

  const selectionPort = (sourceNode as Visualization).getSelectionPort();
  const edgeSelectionToVisualEditor = util.createEdge(selectionPort, visualEditor.getSubsetInputPort(), false) as Edge;
  tracker.createEdge(edgeSelectionToVisualEditor);

  const edgeVisualEditorToUnion = util.createEdge(visualEditor.getSubsetOutputPort(),
    union.getSubsetInputPort(), false) as Edge;
  tracker.createEdge(edgeVisualEditorToUnion);

  tracker.setNodeToConnectToTarget(union);

  if (targets.length) {
    // Shift the visualization to the right to allow space for the union and visual editor.
    targets[0].node.moveBy(HIGHLIGHT_OFFSET_PX * 8, 0);
  }

  util.propagateNodes([sourceNode]);
  tracker.toAutoLayout(util.getNearbyNodes(union));
};
