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
import Network from '@/components/network/network';
import Map from '@/components/map/map';
import Linker from '@/components/linker/linker';
import DataReservoir from '@/components/data-reservoir/data-reservoir';
import ScriptEditor from '@/components/script-editor/script-editor';
import Aggregation from '@/components/aggregation/aggregation';
import Player from '@/components/player/player';
import SeriesTranspose from '@/components/series-transpose/series-transpose';

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
    aliases: ['scp'],
  },
  {
    id: 'parallel-coordinates',
    title: 'Parallel Coordinates',
    imgSrc: require('@/imgs/parallel-coordinates.svg'),
    constructor: ParallelCoordinates,
    tags: VISUALIZATION_TAGS + MULTIDIMENSIONAL_TAGS,
    aliases: ['pcp'],
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
    aliases: ['timeseries'],
  },
  {
    id: 'network',
    title: 'Network',
    imgSrc: require('@/imgs/network.svg'),
    constructor: Network,
    tags: VISUALIZATION_TAGS + ' graph topology',
  },
  {
    id: 'map',
    title: 'Map',
    imgSrc: require('@/imgs/map.svg'),
    constructor: Map,
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
    tags: 'subset attribute remove find pattern range sample minimum maximum extremum',
    aliases: ['filter'],
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
  {
    id: 'linker',
    title: 'Linker',
    imgSrc: require('@/imgs/linker.svg'),
    constructor: Linker,
    tags: 'link filter extract join',
  },
  {
    id: 'data-reservoir',
    title: 'Data Reservoir',
    imgSrc: require('@/imgs/data-reservoir.svg'),
    constructor: DataReservoir,
    tags: 'data reservoir save loopback',
    isBeta: true,
  },
  {
    id: 'script-editor',
    title: 'Script Editor',
    imgSrc: require('@/imgs/script-editor.svg'),
    constructor: ScriptEditor,
    tags: 'script code editor',
    isBeta: true,
  },
  {

    id: 'player',
    title: 'Player',
    imgSrc: require('@/imgs/player.svg'),
    constructor: Player,
    tags: 'player sequence series',
    isBeta: true,
  },
  {
    id: 'aggregation',
    title: 'Aggregation',
    imgSrc: require('@/imgs/aggregation.svg'),
    constructor: Aggregation,
    tags: 'aggregation sum average count minimum maximum',
    isBeta: true,
  },
  {
    id: 'series-transpose',
    title: 'Series Transpose',
    imgSrc: require('@/imgs/series-transpose.svg'),
    constructor: SeriesTranspose,
    tags: 'series transpose data',
    isBeta: true,
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
