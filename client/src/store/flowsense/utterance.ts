import store from '@/store';
import { FlowsenseCategorizedToken, FlowsenseTokenCategory } from './types';
import TabularDataset from '@/data/tabular-dataset';
import { NodeType } from '@/store/dataflow/types';
import { DatasetInfo } from '@/store/dataset/types';

export const getColumnNameUtterances = (): FlowsenseCategorizedToken[] => {
  const utterances: FlowsenseCategorizedToken[] = [];
  store.getters['dataflow/tabularDatasets'].forEach((tabularDataset: TabularDataset) => {
    const columnNames = tabularDataset.getColumns().map(column => column.name);
    for (const name of columnNames) {
      utterances.push({
        matchText: [name],
        category: FlowsenseTokenCategory.COLUMN,
        displayText: name,
        annotation: '/column ' + tabularDataset.getName(),
        value: [name, tabularDataset.getName(), tabularDataset.getHash()],
      });
    }
  });
  return utterances;
};

export const getNodeTypeUtterances = (): FlowsenseCategorizedToken[] => {
  let utterances: FlowsenseCategorizedToken[] = [];
  store.getters['dataflow/nodeTypes'].forEach((nodeType: NodeType) => {
    utterances.push({
      matchText: [nodeType.id, nodeType.title].concat(nodeType.aliases || []),
      category: FlowsenseTokenCategory.NODE_TYPE,
      displayText: nodeType.title.toLowerCase(),
      annotation: '/node type',
      value: [nodeType.id],
    });
  });
  // Move no-input data source to the back to avoid suggestion with no-input node types.
  utterances = utterances.slice(1).concat([utterances[0]]);
  return utterances;
};

export const getNodeLabelUtterances = (): FlowsenseCategorizedToken[] => {
  const utterances: FlowsenseCategorizedToken[] = [];
  store.getters['dataflow/nodeLabels'].forEach((label: string) => {
    utterances.push({
      matchText: [label],
      category: FlowsenseTokenCategory.NODE_LABEL,
      displayText: label,
      annotation: '/node label',
      value: [label],
    });
  });
  return utterances;
};

export const getDatasetNameUtterances = (): FlowsenseCategorizedToken[] => {
  const utterances: FlowsenseCategorizedToken[] = [];
  store.state.dataset.lastList.forEach((dataset: DatasetInfo) => {
    const matchedRawName = dataset.originalname.match(/^(.*)\..*/);
    const rawName = matchedRawName !== null ? matchedRawName[1] : dataset.originalname;
    utterances.push({
      matchText: [rawName, dataset.originalname],
      category: FlowsenseTokenCategory.DATASET,
      displayText: rawName,
      annotation: '/dataset',
      value: [dataset.originalname, dataset.filename],
    });
  });
  return utterances;
};
