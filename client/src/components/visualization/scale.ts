import _ from 'lodash';
import {
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  scaleBand,
  scalePoint,
  ScaleContinuousNumeric,
} from 'd3-scale';
import { AxisScale, AxisDomain } from 'd3-axis';

import { ValueType } from '@/data/parser';
import { isNumericalType } from '@/data/util';

export enum OrdinalScaleType {
  ORDINAL = 'ordinal',
  BAND = 'band',
  POINT = 'point',
}

interface OrdinalScaleOptions {
  type: OrdinalScaleType; // default is POINT
  padding?: number;
}

export interface GetScaleOptions {
  domainMargin?: number;
  rangeMargin?: number;
  ordinal?: OrdinalScaleOptions;
}

export interface Scale extends AxisScale<AxisDomain> {
  (x: number | string): number;
}

export type AnyScale = ScaleContinuousNumeric<number, number>;

export const getScale = (type: ValueType, domain: Array<number | string>, range: number[],
                         options?: GetScaleOptions): Scale => {
  options = options || {};
  const domainMargin = options.domainMargin || 0;
  if (options.rangeMargin) {
    const span = range[1] - range[0];
    range[0] -= span * options.rangeMargin;
    range[1] += span * options.rangeMargin;
  }

  if (isNumericalType(type)) {
    const [min, max] = domain as number[];
    const span = max - min || 1; // avoid single-point scale
    return scaleLinear()
      .domain([min - span * domainMargin, max + span * domainMargin])
      .range(range) as Scale;
  } else if (type === ValueType.DATE) {
    const [min, max] = [new Date(domain[0]).getTime(), new Date(domain[1]).getTime()];
    const span = max - min || 1;
    // Use timestamp to ensure correctness of timescale. Using string values may cause unexpected behaviors:
    // scale.domain(['1970', '1980'])('1975') => .333
    // scale.domain([new Date('1970'), new Date('1980')])('1975') => 6.259254188471056e-9
    //   (also with new Date().getTime() / new Date().valueOf())
    // scale.domain([new Date('1970').toString(), new Date('1980').toString()])('1975') => NaN
    // When using ScaleTime, always pass a Date/timestamp for safety.
    return scaleTime()
      .domain([min - span * domainMargin, max + span * domainMargin])
      .range(range)
      .nice() as Scale;
  } else { // ordinal
    const ordinalOptions: OrdinalScaleOptions = options.ordinal || { type: OrdinalScaleType.POINT };
    const ordinalPadding = (options.ordinal && options.ordinal.padding) || .5;
    const stringDomain = domain.map(value => value.toString()) as string[];
    switch (ordinalOptions.type) {
      case OrdinalScaleType.ORDINAL:
        return scaleOrdinal<number>()
          .domain(stringDomain)
          .range(range) as Scale;
      case OrdinalScaleType.BAND:
        return scaleBand()
          .domain(stringDomain)
          .range(range as [number, number])
          .padding(ordinalPadding) as Scale;
      case OrdinalScaleType.POINT:
      default:
        return scalePoint()
          .domain(stringDomain)
          .range(range as [number, number])
          .padding(ordinalPadding) as Scale;
    }
  }
};
