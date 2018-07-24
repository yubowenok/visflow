import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import _ from 'lodash';

enum ScaleType {
  LINEAR = 'linear',
  ORDINAL = 'ordinal',
}

export interface ColorScaleInfo {
  id: string;
  label: string;
  type: ScaleType;
  contrastColor: string;
  domain: number[];
  range: string[];
}

export const redGreen: ColorScaleInfo = {
  id: 'red-green',
  label: 'Red-Green',
  type: ScaleType.LINEAR,
  contrastColor: 'white',
  domain: [.0, .5, 1.0],
  range: ['red', '#333', 'green'],
};

export const CWYR: ColorScaleInfo = {
  id: 'cwyr',
  label: 'CWYR',
  type: ScaleType.LINEAR,
  contrastColor: 'black',
  domain: [.0, .25, .5, .75, 1.0],
  range: ['cyan', '#d5e9f0', 'white', 'yellow', 'red'],
};

export const monochrome: ColorScaleInfo = {
  id: 'monochrome',
  label: 'Monochrome',
  type: ScaleType.LINEAR,
  contrastColor: 'white',
  domain: [.0, 1.0],
  range: ['black', 'white'],
};

export const redYellow: ColorScaleInfo = {
  id: 'red-yellow',
  label: 'Red-Yellow',
  type: ScaleType.LINEAR,
  contrastColor: 'black',
  domain: [.0, .5, 1.0],
  range: ['red', '#333', 'yellow'],
};

export const yellowBlue: ColorScaleInfo = {
  id: 'yellow-blue',
  label: 'Yellow-Blue',
  type: ScaleType.LINEAR,
  contrastColor: 'black',
  domain: [0.0, 0.5, 1.0],
  range: ['yellow', '#333', 'blue'],
};

export const categorical: ColorScaleInfo = {
  id: 'categorical',
  label: 'Categorical',
  type: ScaleType.ORDINAL,
  contrastColor: 'white',
  domain: _.range(10),
  range: schemeCategory10 as string[],
};

export const allColorScaleInfo: ColorScaleInfo[] = [
  redGreen,
  CWYR,
  monochrome,
  redYellow,
  yellowBlue,
  categorical,
];

const findColorScale = (id: string): ColorScaleInfo => {
  const scale = allColorScaleInfo.find(info => info.id === id);
  if (!scale) {
    console.error(`color scale ${id} not found`);
  }
  return scale as ColorScaleInfo;
};

type ColorScaleCallable = (value: number | string) => string;

// Returns ScaleLinear<string, string> | ScaleOrdinal<number, string> but as an alternative signature.
export const getColorScale = (id: string): ColorScaleCallable => {
  const scale = findColorScale(id);
  if (scale.type === ScaleType.LINEAR) {
    return scaleLinear<string, string>()
      .domain(scale.domain)
      .range(scale.range) as ColorScaleCallable;
  } else { // ScaleType.ORDINAL
    return scaleOrdinal<number, string>()
      .domain(scale.domain)
      .range(scale.range) as ColorScaleCallable;
  }
};

export const getColorScaleGradient = (id: string): string => {
  const scale = findColorScale(id);
  let gradient = 'linear-gradient(to right,';
  if (scale.type === ScaleType.LINEAR) {
    gradient += scale.range.join(',');
  } else { // ScaleType.ORDINAL
    gradient += scale.range.map((val: string, index: number) => {
      return val + ' ' + (index * 100 / scale.range.length) + '%,' +
          val + ' ' + ((index + 1) * 100 / scale.range.length) + '%';
    }).join(',');
  }
  gradient += ')';
  return gradient;
};
