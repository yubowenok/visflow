export interface FlowsenseState {
  enabled: boolean;
  inputVisible: boolean;
  voiceEnabled: boolean;
  activePosition: Point;
}

export enum FlowsenseTokenCategory {
  NONE = 'none', // no identifiable category
  DATASET = 'dataset',
  COLUMN = 'column',
  NODE_TYPE = 'node-type',
  NODE_LABEL = 'node-label',
}

export interface FlowsenseCategorizedToken {
  matchText: string[];
  displayText?: string;
  annotation?: string;
  category: FlowsenseTokenCategory;
  /**
   * Values for different categories:
   *   COLUMN: [columnName, datasetName, datasetHash]
   *   NODE_TYPE: [typeId]
   *   NODE_LABEL: [label]
   *   DATASET: [datasetOriginalname, datasetFilename]
   */
  value: string[];
}

export interface FlowsenseToken {
  index: number; // The start index of the token as it appears in the whole input text
  text: string;
  chosenCategory: number; // -1 is category not yet checked
  categories: FlowsenseCategorizedToken[];
  manuallySet: boolean;
  isPhrase: boolean; // Is a token in a multi-gram phrase (not at the first position)
}

export interface FlowsenseResult {
  success: boolean;
  query: string;
  tokens: string[];
  lemmatizedTokens: string[];
  posTags: string[];
  nerTags: string[];
  nerValues: string[];
  stringValue: string;
  value: QueryValue;
}

export interface SourceNodeDescriptor {
  id: string; // node label, node type
  isSelection?: boolean;
}

export interface TargetNodeDescriptor {
  id: string; // node label, node type
  isCreate?: boolean;
}

export interface VisualEncodingSpecification {
  column: string;
  type: string; // which visual property
  scale: string | number[]; // color scale id or numerical scale range
}

export interface VisualsSpecification {
  assignment?: { [prop: string]: string | number };
  encoding?: VisualEncodingSpecification;
}

export interface FilterSpecification {
  column: string;
  // Filter type is inferred by which of the following properties is present.
  pattern?: string;
  sampling?: 'random';
  extremum?: 'minimum' | 'maximum';
  range?: {
    min?: number | string;
    max?: number | string;
  };
  amount?: number;
  amountType?: 'percentage' | 'count';
}

export interface SetOperatorSpecification {
  type: string; // union, intersection, difference
  nodes: SourceNodeDescriptor[];
}

export interface ExtractSpecification {
  column: string;
}

export interface LinkSpecification {
  extractColumn?: string;
  filterColumn?: string;
}

export interface EdgeSpecification {
  type: 'connect' | 'disconnect';
  nodes: Array<SourceNodeDescriptor | TargetNodeDescriptor>;
}

export interface QueryValue {
  loadDataset?: string;
  autoLayout?: boolean;
  columns?: string[];
  seriesColumn?: string;
  groupByColumn?: string;
  visuals?: VisualsSpecification[];
  filters?: FilterSpecification[];
  extract?: ExtractSpecification;
  link?: LinkSpecification;
  setOperator?: SetOperatorSpecification;
  edge?: EdgeSpecification;
  source?: SourceNodeDescriptor[];
  target?: TargetNodeDescriptor[];
  // special operation flags
  highlight?: boolean;
  select?: boolean;
  undo?: boolean;
  redo?: boolean;
}

export enum FlowsenseEventType {
  CREATE_NODES = 'create-nodes',
  CHANGE_NODE_OPTIONS = 'change-node-options',
}

export const FlowsenseDef = {
  DEFAULT_CHART_TYPE: '_default_chart_type',
  SERIES_CHART_TYPE: '_series_chart_type',
  DEFAULT_SOURCE: '_default_source',
  ALL_COLUMNS: '_all_columns',
  SELECTION: '_selection',
  INDEX_COLUMN: '_index',
  NUMBER_VALUE: 'r_number',
  STRING_VALUE: 'r_string',
};
