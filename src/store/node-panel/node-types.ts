export interface NodeTypeInfo {
  id: string;
  title: string;
  imgSrc: string;
}

export const nodeTypes: NodeTypeInfo[] = [
  {
    id: 'data-source',
    title: 'Data Source',
    imgSrc: require('@/imgs/data-source.svg'),
  },
  {
    id: 'table',
    title: 'Table',
    imgSrc: require('@/imgs/table.svg'),
  },
  {
    id: 'scatterplot',
    title: 'Scatterplot',
    imgSrc: require('@/imgs/scatterplot.svg'),
  },
  {
    id: 'parallel-coordinates',
    title: 'Parallel Coordinates',
    imgSrc: require('@/imgs/parallel-coordinates.svg'),
  },
  {
    id: 'histogram',
    title: 'Histogram',
    imgSrc: require('@/imgs/histogram.svg'),
  },
  {
    id: 'heatmap',
    title: 'Heatmap',
    imgSrc: require('@/imgs/heatmap.svg'),
  },
  {
    id: 'line-chart',
    title: 'Line Chart',
    imgSrc: require('@/imgs/line-chart.svg'),
  },
  {
    id: 'network',
    title: 'Network',
    imgSrc: require('@/imgs/network.svg'),
  },
  {
    id: 'map',
    title: 'Map',
    imgSrc: require('@/imgs/map.svg'),
  },
  {
    id: 'visual-editor',
    title: 'Visual Editor',
    imgSrc: require('@/imgs/visual-editor.svg'),
  },
  {
    id: 'filter',
    title: 'Filter',
    imgSrc: require('@/imgs/filter.svg'),
  },
  {
    id: 'set-operator',
    title: 'Set Operator',
    imgSrc: require('@/imgs/set-operator.svg'),
  },
  {
    id: 'value-generator',
    title: 'Value Generator',
    imgSrc: require('@/imgs/value-generator.svg'),
  },
];
