import { VueConstructor } from 'vue';

import { NodeType } from '@/store/dataflow/types';
import Visualization from '@/components/visualization/visualization';
import DataSource from '@/components/data-source/data-source';
import Table from '@/components/table/table';
import Scatterplot from '@/components/scatterplot/scatterplot';
import Histogram from '@/components/histogram/histogram';
import Heatmap from '@/components/heatmap/heatmap';
import ParallelCoordinates from '@/components/parallel-coordinates/parallel-coordinates';
import AttributeFilter from '@/components/attribute-filter/attribute-filter';
import VisualEditor from '@/components/visual-editor/visual-editor';
import SetOperator from '@/components/set-operator/set-operator';
import ConstantsGenerator from '@/components/constants-generator/constants-generator';
import LineChart from '@/components/line-chart/line-chart';

const VISUALIZATION_TAGS = 'vis plot chart draw render';
const MULTIDIMENSIONAL_TAGS = ' multi md';

export const nodeTypes: NodeType[] = [
  {
    id: 'data-source',
    title: 'Data Source',
    imgSrc: require('@/imgs/data-source.svg'),
    constructor: DataSource,
    tags: 'read load table csv',
  },
  {
    id: 'table',
    title: 'Table',
    imgSrc: require('@/imgs/table.svg'),
    constructor: Table,
    tags: VISUALIZATION_TAGS,
  },
  {
    id: 'scatterplot',
    title: 'Scatterplot',
    imgSrc: require('@/imgs/scatterplot.svg'),
    constructor: Scatterplot,
    tags: VISUALIZATION_TAGS + ' 2d',
  },
  {
    id: 'parallel-coordinates',
    title: 'Parallel Coordinates',
    imgSrc: require('@/imgs/parallel-coordinates.svg'),
    constructor: ParallelCoordinates,
    tags: VISUALIZATION_TAGS + MULTIDIMENSIONAL_TAGS,
  },
  {
    id: 'histogram',
    title: 'Histogram',
    imgSrc: require('@/imgs/histogram.svg'),
    constructor: Histogram,
    tags: VISUALIZATION_TAGS + ' 1d',
  },
  {
    id: 'heatmap',
    title: 'Heatmap',
    imgSrc: require('@/imgs/heatmap.svg'),
    constructor: Heatmap,
    tags: VISUALIZATION_TAGS + MULTIDIMENSIONAL_TAGS,
  },
  {
    id: 'line-chart',
    title: 'Line Chart',
    imgSrc: require('@/imgs/line-chart.svg'),
    constructor: LineChart,
    tags: VISUALIZATION_TAGS + ' series time trend',
  },
  {
    id: 'network',
    title: 'Network',
    imgSrc: require('@/imgs/network.svg'),
    constructor: Visualization,
    tags: VISUALIZATION_TAGS + ' graph topology',
  },
  {
    id: 'map',
    title: 'Map',
    imgSrc: require('@/imgs/map.svg'),
    constructor: Visualization,
    tags: VISUALIZATION_TAGS + ' geo',
  },
  {
    id: 'visual-editor',
    title: 'Visual Editor',
    imgSrc: require('@/imgs/visual-editor.svg'),
    constructor: VisualEditor,
    tags: 'color render dye property',
  },
  {
    id: 'attribute-filter',
    title: 'Attribute Filter',
    imgSrc: require('@/imgs/filter.svg'),
    constructor: AttributeFilter,
    tags: 'subset attribute remove find pattern range sample',
  },
  {
    id: 'set-operator',
    title: 'Set Operator',
    imgSrc: require('@/imgs/set-operator.svg'),
    constructor: SetOperator,
    tags: 'subset union intersection difference',
  },
  {
    id: 'constants-generator',
    title: 'Constants Generator',
    imgSrc: require('@/imgs/constants-generator.svg'),
    constructor: ConstantsGenerator,
    tags: 'constant extraction',
  },
];

const findNodeType = (type: string): NodeType | undefined => {
  for (const nodeType of nodeTypes) {
    if (nodeType.id === type) {
      return nodeType;
    }
  }
  console.error(`node type ${type} is not registered`);
};

/**
 * Retrieves the Vue constructor for a given type of node.
 * @param type is a string matching the id of a node type.
 */
export const getConstructor = (type: string): VueConstructor => {
  const nodeType = findNodeType(type) as NodeType;
  return nodeType.constructor as VueConstructor;
};

/**
 * Retrieves the img source for a given type of node.
 * @param type is a string matching the id of a node type.
 */
export const getImgSrc = (type: string): string => {
  const nodeType = findNodeType(type) as NodeType;
  return nodeType.imgSrc;
};
