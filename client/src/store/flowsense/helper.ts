import _ from 'lodash';
import {
  FlowsenseToken,
  FlowsenseTokenCategory,
  FlowsenseCategorizedToken,
  QueryValue,
} from './types';

import * as update from './update';

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
 * Executes the query. Ejects the markers on the fly.
 */
export const executeQuery = (value: QueryValue, query: InjectedQuery) => {
  // TODO: complete query execution
  console.log('execute', value);
  if (value.setOperator) {
    update.createSetOperator(value, query);
  }

  if (value.filters) {

  }
};
