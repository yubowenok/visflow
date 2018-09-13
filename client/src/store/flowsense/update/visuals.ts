import _ from 'lodash';
import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, VisualsSpecification, VisualEncodingSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Node } from '@/components/node';
import Edge from '@/components/edge/edge';
import { SubsetNode } from '@/components/subset-node';
import VisualEditor, { VisualEditorMode } from '@/components/visual-editor/visual-editor';
import * as visualEditorHistory from '@/components/visual-editor/history';
import { Visualization } from '@/components/visualization';
import { VisualProperties } from '@/data/visuals';

/**
 * Actually creates a visual editor when no existing editor is present.
 */
const createVisualEditor = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                            sources: QuerySource[], targets: QueryTarget[]) => {
  const visuals = (value.visuals as VisualsSpecification[])[0];

  const isFromSource = sources.length > 0; // Otherwise it is inserted before the target.
  const nodeWithData = sources.length ? sources[0].node : targets[0].node;

  const nodeSave: any = {}; // tslint:disable-line no-any
  let encodingColumn: number | null = null;
  switch (true) {
    case visuals.assignment !== undefined:
      nodeSave.mode = VisualEditorMode.ASSIGNMENT;
      nodeSave.visuals = _.extend({
        color: null,
        border: null,
        size: null,
        width: null,
        opacity: null,
      }, visuals.assignment);
      break;
    case visuals.encoding !== undefined:
      const encoding = visuals.encoding as VisualEncodingSpecification;
      nodeSave.mode = VisualEditorMode.ENCODING;
      nodeSave.encoding = {
        type: encoding.type,
      };
      encodingColumn = util.getColumnMarkerIndex(query, nodeWithData as SubsetNode, encoding.column);
      if (typeof encoding.scale === 'string') {
        nodeSave.colorScaleId = encoding.scale; // color scale id
      } else {
        nodeSave.numericalScale = encoding.scale; // numerical range
      }
      break;
  }

  const visualEditor = util.createNode(util.getCreateNodeOptions('visual-editor'), nodeSave) as VisualEditor;
  tracker.createNode(visualEditor);

  const toPropagate: Node[] = [];
  if (isFromSource) {
    if ((nodeWithData as Visualization).isVisualization) {
      const source = nodeWithData as Visualization;
      // If the source node is a visualization, the visual editor is applied on the input of the visualization,
      // so that the visuals take effect in the visualization node.
      const inputEdges = source.getSubsetInputPort().getAllEdges();
      if (inputEdges.length > 1) {
        tracker.cancel(`FlowSense does not support visualization with multiple inputs`);
        return;
      }
      const inputEdge = inputEdges[0];
      const upflowPort = inputEdge.source;
      const downflowPort = inputEdge.target;
      util.removeEdge(inputEdge, false);
      tracker.removeEdge(inputEdge);

      const edgeToDownflow = util.createEdge(visualEditor.getSubsetOutputPort(), downflowPort, false);
      const edgeFromUpflow = util.createEdge(upflowPort, visualEditor.getSubsetInputPort(), false);
      tracker.createEdge(edgeToDownflow as Edge);
      tracker.createEdge(edgeFromUpflow as Edge);

      toPropagate.push(upflowPort.node);
    } else {
      const sourcePort = sources[0].port;
      if (!sourcePort) {
        tracker.cancel(`node ${sources[0].node.getLabel()} does not have connectable output port`);
        return;
      }
      const targetPort = visualEditor.getSubsetInputPort();
      const edgeFromSource = util.createEdge(sourcePort, targetPort, false);
      tracker.createEdge(edgeFromSource as Edge);

      toPropagate.push(nodeWithData);
    }
  } else { // The command only has target but no source.
    const source = (nodeWithData as SubsetNode).getInputNodes()[0];
    if (source) {
      const edgeFromSource = util.createEdge((source as SubsetNode).getSubsetOutputPort(),
        visualEditor.getSubsetInputPort(), false);
      tracker.createEdge(edgeFromSource as Edge);
    }
    const target = nodeWithData;
    if (target) {
      const edgeToTarget = util.createEdge(visualEditor.getSubsetOutputPort(),
        (target as SubsetNode).getSubsetInputPort(), false);
      tracker.createEdge(edgeToTarget as Edge);
    }

    toPropagate.push(nodeWithData);
  }

  util.propagateNodes(toPropagate);

  // Set column after propagation to avoid column being overwritten by onDatasetChange.
  if (encodingColumn !== null) {
    visualEditor.setEncodingColumn(encodingColumn);
  }
  tracker.toAutoLayout(util.getNearbyNodes(visualEditor));
};

/**
 * Updates the options of the visual editor.
 */
export const updateVisualEditor = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                                   visualEditor: VisualEditor) => {
  const visuals = (value.visuals as VisualsSpecification[])[0];
  const mode = visualEditor.getMode();
  if (visuals.assignment) {
    const assignment: VisualProperties = visuals.assignment;
    const current = visualEditor.getVisualsAssignment();
    tracker.changeNodeOption(visualEditorHistory.selectModeEvent(visualEditor, VisualEditorMode.ASSIGNMENT, mode));
    visualEditor.setMode(VisualEditorMode.ASSIGNMENT);
    if (assignment.color !== undefined) {
      tracker.changeNodeOption(visualEditorHistory.inputVisualsColorEvent(visualEditor, assignment.color,
        current.color));
      visualEditor.setVisualsColor(assignment.color);
    }
    if (assignment.border) {
      tracker.changeNodeOption(visualEditorHistory.inputVisualsBorderEvent(visualEditor, assignment.border,
        current.border));
      visualEditor.setVisualsBorder(assignment.border);
    }
    if (assignment.size) {
      tracker.changeNodeOption(visualEditorHistory.inputVisualsSizeEvent(visualEditor, assignment.size, current.size));
      visualEditor.setVisualsSize(assignment.size);
    }
    if (assignment.width) {
      tracker.changeNodeOption(visualEditorHistory.inputVisualsWidthEvent(visualEditor, assignment.width,
        current.width));
      visualEditor.setVisualsWidth(assignment.width);
    }
    if (assignment.opacity) {
      tracker.changeNodeOption(visualEditorHistory.inputVisualsOpacityEvent(visualEditor, assignment.opacity,
        current.opacity));
      visualEditor.setVisualsOpacity(assignment.opacity);
    }
  } else if (visuals.encoding) {
    tracker.changeNodeOption(visualEditorHistory.selectModeEvent(visualEditor, VisualEditorMode.ENCODING, mode));
    visualEditor.setMode(VisualEditorMode.ENCODING);

    const encoding: VisualEncodingSpecification = visuals.encoding;
    const current = visualEditor.getVisualsEncoding();
    const encodingColumn = util.getColumnMarkerIndex(query, visualEditor, encoding.column);
    tracker.changeNodeOption(visualEditorHistory.selectEncodingColumnEvent(visualEditor, encodingColumn,
      current.column));
    visualEditor.setEncodingColumn(encodingColumn);

    if (typeof encoding.scale === 'string') { // color scale id
      tracker.changeNodeOption(visualEditorHistory.selectEncodingColorScaleEvent(visualEditor, encoding.scale,
        current.colorScaleId));
      visualEditor.setEncodingColorScale(encoding.scale);
    } else { // numerical range
      const [min, max] = [+encoding.scale[0], +encoding.scale[1]];
      tracker.changeNodeOption(visualEditorHistory.inputEncodingScaleMinEvent(visualEditor, min,
        current.numericalScale.min));
      tracker.changeNodeOption(visualEditorHistory.inputEncodingScaleMinEvent(visualEditor, max,
        current.numericalScale.max));
      visualEditor.setEncodingScaleMin(min);
      visualEditor.setEncodingScaleMax(max);
    }
  }
  visualEditor.select();
  visualEditor.activate();
};

/**
 * Creates or updates a visual editor.
 */
export const createOrUpdateVisualEditor = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                                           sources: QuerySource[], targets: QueryTarget[]) => {
  const isFromSource = sources.length > 0; // Otherwise it is inserted before the target.
  const nodeWithData = sources.length ? sources[0].node : targets[0].node;

  if (isFromSource && nodeWithData.nodeType === 'visual-editor') {
    // If the source is already a visual editor, update it.
    updateVisualEditor(tracker, value, query, nodeWithData as VisualEditor);
  } else {
    createVisualEditor(tracker, value, query, sources, targets);
  }
};
