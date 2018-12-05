import _ from 'lodash';
import {
  FlowsenseToken,
  FlowsenseTokenCategory,
  FlowsenseCategorizedToken,
  QueryValue,
  FlowsenseDef,
} from './types';
import * as util from './update/util';
import * as update from './update';
import * as utterance from './utterance';
import { OutputPort, InputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import { Node } from '@/components/node';
import { Visualization } from '@/components/visualization';
import FlowsenseUpdateTracker from '@/store/flowsense/update/tracker';
import { randomInt } from '@/common/util';


interface InjectedToken {
  marker: string;
  token: FlowsenseCategorizedToken;
}

interface MarkerMapping {
  [marker: string]: FlowsenseCategorizedToken;
}

interface InjectionMapping {
  dataset: { [token: string]: string; };
  nodeLabel: { [token: string]: string; };
  column: { [token: string]: string; };
  nodeType: { [token: string]: string; };
}

export interface InjectedQuery {
  query: string;
  rawQuery: string;
  tokens: FlowsenseToken[];
  mapping: InjectionMapping;
  markerMapping: MarkerMapping;
}

export interface QuerySource {
  node: Node;
  port: OutputPort;
}

export interface QueryTarget {
  node: Node;
  port: InputPort;
}

/**
 * Generates special utterances based on the current diagram.
 */
export const getSpecialUtterances = (): FlowsenseCategorizedToken[] => {
  return utterance.getColumnNameUtterances()
    .concat(utterance.getNodeTypeUtterances())
    .concat(utterance.getNodeLabelUtterances())
    .concat(utterance.getDatasetNameUtterances());
};

/**
 * Replaces special utterance markers in the auto completed query by real values.
 * The real values are found from the datasets, or just placeholders.
 */
export const ejectSuggestionToken = (token: FlowsenseToken) => {
  if (token.chosenCategory === -1) {
    token.chosenCategory = 0;
  }
  const matchedColumnMarker = token.text.match(/^r_column_(.*)$/);
  if (matchedColumnMarker !== null) {
    const columns = utterance.getColumnNameUtterances();
    if (columns.length) {
      const category = columns[randomInt(columns.length) % columns.length];
      token.categories.push(category);
      token.chosenCategory = token.categories.length - 1;
      token.text = category.value[0];
    }
  }

  const matchedNodeTypeMarker = token.text.match(/^r_node_type_(.*)$/);
  if (matchedNodeTypeMarker !== null) {
    const nodeTypes = utterance.getNodeTypeUtterances();
    // Always use scatterplot
    // TODO: choose type based on action
    const category = nodeTypes[1];
    token.categories.push(category);
    token.chosenCategory = token.categories.length - 1;
    token.text = category.displayText as string;
  }

  const matchedNodeLabelMarker = token.text.match(/^r_node_label_(.*)$/);
  if (matchedNodeLabelMarker !== null) {
    const nodeLabels = utterance.getNodeLabelUtterances();
    const category = nodeLabels[randomInt(nodeLabels.length) % nodeLabels.length];
    token.categories.push(category);
    token.chosenCategory = token.categories.length - 1;
    token.text = category.value[0];
  }

  if (token.text === FlowsenseDef.NUMBER_VALUE) {
    token.text = '[number]';
  }

  if (token.text === FlowsenseDef.STRING_VALUE) {
    token.text = '[string]';
  }
};

/**
 * Assigns a special marker for the categorized token, which will be treated as special utterance by Flowsense parser.
 * @param value The unique original value of the token.
 * @param prefix Marker prefix, e.g. "r_column_", "r_node_".
 * @param mapping Mapping dictionary storing all assigned markers.
 */
const assignMarker = (value: string, prefix: string, categorized: FlowsenseCategorizedToken,
                      mapping: { [token: string]: string },
                      markerMapping: MarkerMapping): string => {
  if (value in mapping) {
    return mapping[value];
  }
  const id = _.size(mapping) + 1;
  const marker = prefix + id;
  mapping[value] = marker;
  markerMapping[marker] = categorized;
  return marker;
};

/**
 * Injects the query by replacing special utterances with markers that start with "r_".
 * The markers can be used to assist FlowSense parser.
 */
export const injectQuery = (tokens: FlowsenseToken[], rawQuery: string): InjectedQuery => {
  let query = '';
  const mapping = {
    dataset: {},
    nodeLabel: {},
    column: {},
    nodeType: {},
  };
  const markerMapping = {};
  for (const token of tokens) {
    const categorized = token.categories[token.chosenCategory];
    const category = categorized.category;
    let marker = token.text;
    if (category === FlowsenseTokenCategory.DATASET) {
      const value = categorized.value[0];
      marker = assignMarker(value, 'r_dataset_', categorized, mapping.dataset, markerMapping);
    } else if (category === FlowsenseTokenCategory.NODE_LABEL) {
      const value = categorized.value[0];
      marker = assignMarker(value, 'r_node_label_', categorized, mapping.nodeLabel, markerMapping);
    } else if (category === FlowsenseTokenCategory.NODE_TYPE) {
      const value = categorized.value[0];
      marker = assignMarker(value, 'r_node_type_', categorized, mapping.nodeType, markerMapping);
    } else if (category === FlowsenseTokenCategory.COLUMN) {
      const value = categorized.value[0] + '/' + categorized.value[2]; // column name / filename (hash)
      marker = assignMarker(value, 'r_column_', categorized, mapping.column, markerMapping);
    }
    query += marker;
  }
  return {
    query,
    rawQuery,
    tokens,
    mapping,
    markerMapping,
  };
};

/**
 * Ejects a marker and returns its original categorized token.
 */
export const ejectMarker = (marker: string, markerMapping: MarkerMapping): FlowsenseCategorizedToken | null => {
  if (!(marker in markerMapping)) {
    return null;
  }
  return markerMapping[marker];
};

/**
 * Wrapper for ejectMarker that ensures that the marker is mappable.
 * If the marker is not an injection, such as "r_chart", "histogram" the method panics.
 */
export const ejectMappableMarker = (marker: string, markerMapping: MarkerMapping): FlowsenseCategorizedToken => {
  const result = ejectMarker(marker, markerMapping);
  if (result === null) {
    console.error(`${marker} is not in markerMapping`);
  }
  return result as FlowsenseCategorizedToken;
};

/**
 * Parses the query source field and returns the ejected query sources.
 * The query sources are a list of nodes with specified ports.
 */
const getQuerySources = (value: QueryValue, query: InjectedQuery, tracker: FlowsenseUpdateTracker):
  QuerySource[] | null => {
  // If value does not have source, fill in the default source.
  // Note that a query handler may choose not to use any source (e.g. load dataset).
  if (!value.source) {
    const defaultSources = util.getDefaultSources(1);
    if (!defaultSources.length) {
      return []; // No nodes yet
    }
    const node = util.getDefaultSources(1)[0];
    if (!(node as SubsetNode).getSubsetOutputPort) {
      return [];
    }
    return [ { node, port: (node as SubsetNode).getSubsetOutputPort() } ];
  }
  const sources = value.source.map(spec => {
    let node: Node;
    if (spec.id === FlowsenseDef.DEFAULT_SOURCE) {
      node = util.getDefaultSources(1)[0];
    } else if (spec.id.match(/node_type/)) {
      const nodeType = ejectMappableMarker(spec.id, query.markerMapping).value[0];
      const foundNode = util.findNodeWithType(nodeType);
      if (!foundNode) {
        tracker.cancel(`cannot find a ${nodeType} node`);
        return null;
      }
      node = foundNode;
    } else { // node label
      const nodeLabel = ejectMappableMarker(spec.id, query.markerMapping).value[0];
      const foundNode = util.findNodeWithLabel(nodeLabel);
      if (!foundNode) {
        tracker.cancel(`cannot find node with label ${nodeLabel}`);
        return null;
      }
      node = foundNode;
    }
    const isSelection = spec.isSelection || false;
    let port: OutputPort;
    if (isSelection) {
      if (!(node as Visualization).getSelectionPort) {
        tracker.cancel(`node ${node.getLabel()} does not have selection output`);
        return null;
      }
      port = (node as Visualization).getSelectionPort();
    } else {
      if (!(node as SubsetNode).getSubsetOutputPort) {
        tracker.cancel(`node ${node.getLabel()} does not have subset output port`);
        return null;
      }
      port = (node as SubsetNode).getSubsetOutputPort();
    }
    return { node, port };
  });
  if (sources.findIndex(source => source === null) !== -1) {
    return null; // errored
  }
  return sources as QuerySource[];
};

/**
 * Parses the query target field and returns the ejected query targets.
 * Creates the target nodes if the specification indicates new node creation.
 */
const getQueryTargets = (value: QueryValue, query: InjectedQuery, tracker: FlowsenseUpdateTracker): QueryTarget[] => {
  // A query may have no targets.
  if (!value.target) {
    return [];
  }
  let errored = false;
  const results = value.target.map(spec => {
    let node: Node;
    if (spec.isCreate) {
      let nodeType = spec.id;
      if (nodeType === FlowsenseDef.DEFAULT_CHART_TYPE) {
        // Choose default chart type here
        if (value.seriesColumn !== undefined || value.groupByColumn !== undefined) {
          // series column is present, use a line chart
          nodeType = 'line-chart';
        } else if ((value.columns || []).indexOf(FlowsenseDef.ALL_COLUMNS) !== -1) {
          // If all columns are to be shown, use parallel coordinates.
          nodeType = 'parallel-coordinates';
        } else {
          // There are no specified chart type.
          // Simply choose a chart based on the number of columns to show.
          // 1: histogram
          // 2: scatterplot
          // 3 or more: parallel coordinates
          const numColumns = value.columns ? value.columns.length : 2;
          nodeType = numColumns >= 3 ? 'parallel-coordinates' : (numColumns === 1 ? 'histogram' : 'scatterplot');
        }
      } else if (nodeType === FlowsenseDef.SERIES_CHART_TYPE) {
        nodeType = 'line-chart';
      } else {
        const ejected = ejectMarker(nodeType, query.markerMapping);
        // If the token cannot be ejected, it is a nodeType string itself.
        nodeType = ejected !== null ? ejected.value[0] : nodeType;
      }
      node = util.createNode(util.getCreateNodeOptions(nodeType));
      tracker.createNode(node);
    } else { // TODO: use label?
      const nodeLabel = ejectMappableMarker(spec.id, query.markerMapping).value[0];
      const foundNode = util.findNodeWithLabel(nodeLabel);
      if (!foundNode) {
        tracker.cancel(`cannot find node with label ${nodeLabel}`);
        errored = true;
        return null;
      }
      node = foundNode;
    }
    let port: InputPort;
    if ((node as SubsetNode).getSubsetInputPort) {
      port = (node as SubsetNode).getSubsetInputPort();
    } else {
      port = node.getInputPort('in');
    }
    return { node, port };
  });
  if (errored) {
    return [];
  }
  return results as QueryTarget[];
};

/**
 * Executes the query. Ejects the markers on the fly.
 */
export const executeQuery = (value: QueryValue, query: InjectedQuery) => {
  // TODO: complete query execution
  console.log('execute', value);

  const tracker = new FlowsenseUpdateTracker(query);
  const sources = getQuerySources(value, query, tracker);
  const targets = getQueryTargets(value, query, tracker);
  let message = 'create ';

  // undo and redo do not affect diagram layout
  // They do not commit an action to the history stack.
  if (value.undo || value.redo) {
    if (value.undo) {
      update.undo(tracker);
      message = 'undo';
    } else if (value.redo) {
      update.redo(tracker);
      message = 'redo';
    }
    return;
  }

  // Whether the operation results in a single chart creation.
  let onlyCreateChart = true;

  if (!sources) {
    return;
  }

  if (value.loadDataset) {
    update.loadDataset(tracker, value, query, targets);
    message = 'load dataset';
    onlyCreateChart = false;
  }

  if (value.setOperator) {
    update.createSetOperator(tracker, value, query);
    message = 'set operator';
    onlyCreateChart = false;
  }

  if (value.filters) {
    update.createFilter(tracker, value, query, sources, targets);
    message = 'filter';
    onlyCreateChart = false;
  }

  if (value.visuals) {
    update.createOrUpdateVisualEditor(tracker, value, query, sources, targets);
    message = 'visual editor';
    onlyCreateChart = false;
  }

  if (value.highlight) {
    update.createHighlightSubdiagram(tracker, value, query, sources, targets);
    message = 'highlight';
    onlyCreateChart = false;
  }

  if (value.extract) {
    update.createConstantsGenerator(tracker, value, query, sources, targets);
    message = 'extract constants';
    onlyCreateChart = false;
  }

  if (value.link) {
    update.linkNodes(tracker, value, query, sources, targets);
    message = 'link';
    onlyCreateChart = false;
  }

  // Applies chart's column settings when the diagram completes.
  const visualizationTarget = targets.find(target => (target.node as Visualization).isVisualization);
  if (visualizationTarget) {
    update.completeChart(tracker, value, query, sources, visualizationTarget, onlyCreateChart);
    message += (message ? ' ' : '') + 'visualization';
  }

  if (value.autoLayout) {
    update.autoLayout(tracker);
  }

  tracker.selectCreatedNodes();
  tracker.autoLayoutAndCommit(message);
};
