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
import { OutputPort, InputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import { Node } from '@/components/node';
import { Visualization } from '@/components/visualization';
import FlowsenseUpdateTracker from '@/store/flowsense/update/tracker';

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
export const injectQuery = (tokens: FlowsenseToken[]): InjectedQuery => {
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
    tokens,
    mapping,
    markerMapping,
  };
};

/**
 * Ejects a marker and returns its original categorized token. If the marker is not an injection, such as "r_chart",
 * the method panics.
 */
export const ejectMarker = (marker: string, markerMapping: MarkerMapping): FlowsenseCategorizedToken => {
  if (!(marker in markerMapping)) {
    console.error(`${marker} is not in markerMapping`);
  }
  return markerMapping[marker];
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
    const node = util.getDefaultSources(1)[0] as SubsetNode;
    return [ { node, port: node.getSubsetOutputPort() } ];
  }
  const sources = value.source.map(spec => {
    const node: Node = spec.id === FlowsenseDef.DEFAULT_SOURCE ? util.getDefaultSources(1)[0] :
      util.findNodeWithLabel(ejectMarker(spec.id, query.markerMapping).value[0]);
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
  return value.target.map(spec => {
    let node: Node;
    if (spec.isCreate) {
      let nodeType = spec.id;
      if (nodeType === FlowsenseDef.DEFAULT_CHART_TYPE) {
        // Choose default chart type here
        const numColumns = value.columns ? value.columns.length : 2;
        nodeType = numColumns >= 3 ? 'parallel-coordinates' : (numColumns === 1 ? 'histogram' : 'scatterplot');
      } else {
        nodeType = ejectMarker(nodeType, query.markerMapping).value[0];
      }
      node = util.createNode(util.getCreateNodeOptions(nodeType));
      tracker.createNode(node);
    } else {
      node = util.findNodeWithLabel(spec.id);
    }
    const port = (node as SubsetNode).getSubsetInputPort();
    return { node, port };
  });
};

/**
 * Executes the query. Ejects the markers on the fly.
 */
export const executeQuery = (value: QueryValue, query: InjectedQuery) => {
  // TODO: complete query execution
  console.log('execute', value);

  const tracker = new FlowsenseUpdateTracker();
  const sources = getQuerySources(value, query, tracker);
  const targets = getQueryTargets(value, query, tracker);
  let message = 'create ';

  // Whether the operation results in a single chart creation.
  let onlyCreateChart = true;

  if (!sources) {
    return;
  }

  if (value.loadDataset) {
    update.loadDataset(tracker, value, query);
    message = 'load dataset';
    onlyCreateChart = false;
  }

  if (value.setOperator) {
    update.createSetOperator(tracker, value, query);
    message = 'set operator';
    onlyCreateChart = false;
  }

  if (value.filters) {
    update.createFilter(tracker, value, query, sources);
    message = 'filter';
    onlyCreateChart = false;
  }

  // Applies chart's column settings when the diagram completes.
  const visualizationTarget = targets.find(target => (target.node as Visualization).isVisualization);
  if (visualizationTarget) {
    update.completeChart(tracker, value, query, sources, visualizationTarget, onlyCreateChart);
    message += (message ? ', ' : '') + 'visualization';
  }

  if (value.autoLayout) {
    update.autoLayout(tracker);
  }

  tracker.selectCreatedNodes();
  tracker.autoLayoutAndCommit(message);
};
