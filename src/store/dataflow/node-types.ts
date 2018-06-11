import { VueConstructor } from 'vue';

import { NodeType } from './types';
import Visualization from '@/components/visualization/visualization';
import Node from '@/components/node/node';

export const nodeTypes: NodeType[] = [
  {
    id: 'data-source',
    title: 'Data Source',
    imgSrc: require('@/imgs/data-source.svg'),
    constructor: Node, // test only
  },
  {
    id: 'table',
    title: 'Table',
    imgSrc: require('@/imgs/table.svg'),
    constructor: Visualization, // test only
  },
  {
    id: 'scatterplot',
    title: 'Scatterplot',
    imgSrc: require('@/imgs/scatterplot.svg'),
    constructor: Visualization,
  },
  {
    id: 'parallel-coordinates',
    title: 'Parallel Coordinates',
    imgSrc: require('@/imgs/parallel-coordinates.svg'),
    constructor: Visualization,
  },
  {
    id: 'histogram',
    title: 'Histogram',
    imgSrc: require('@/imgs/histogram.svg'),
    constructor: Visualization,
  },
  {
    id: 'heatmap',
    title: 'Heatmap',
    imgSrc: require('@/imgs/heatmap.svg'),
    constructor: Visualization,
  },
  {
    id: 'line-chart',
    title: 'Line Chart',
    imgSrc: require('@/imgs/line-chart.svg'),
    constructor: Visualization,
  },
  {
    id: 'network',
    title: 'Network',
    imgSrc: require('@/imgs/network.svg'),
    constructor: Visualization,
  },
  {
    id: 'map',
    title: 'Map',
    imgSrc: require('@/imgs/map.svg'),
    constructor: Visualization,
  },
  {
    id: 'visual-editor',
    title: 'Visual Editor',
    imgSrc: require('@/imgs/visual-editor.svg'),
    constructor: Visualization,
  },
  {
    id: 'filter',
    title: 'Filter',
    imgSrc: require('@/imgs/filter.svg'),
    constructor: Visualization,
  },
  {
    id: 'set-operator',
    title: 'Set Operator',
    imgSrc: require('@/imgs/set-operator.svg'),
    constructor: Visualization,
  },
  {
    id: 'value-generator',
    title: 'Value Generator',
    imgSrc: require('@/imgs/value-generator.svg'),
    constructor: Visualization,
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
export const getImgSrc = (type: string): string | undefined => {
  const nodeType = findNodeType(type) as NodeType;
  return nodeType.imgSrc;
};
