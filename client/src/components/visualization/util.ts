import _ from 'lodash';
import { ScaleLinear, ScaleOrdinal, ScaleBand, ScaleTime, ScalePoint } from 'd3-scale';

import { VisualProperties } from '@/data/package/subset-package';

type Value = number | string | Date;
export type Scale = ScaleTime<Date | number, number> |
  ScaleLinear<number, number> |
  ScaleOrdinal<number | string, number> |
  ScalePoint<number | string> | ScaleBand<number | string>;

  /*
export interface Scale {
  (x: any): number; // tslint:disable-line
  domain: (arg: Value[]) => Scale;
  domain: () => Value[];
  range: (arg: Value[]) => Scale;
  range: () => Value[];
}
*/

// Supports numerical property multipliers.
interface VisualMultiplier {
  size?: number;
  borderWidth?: number;
  opacity?: number;
}

/**
 * Highlight effect for selected elements. The size and width are multiplied by this factor.
 */
const selectedVisualMultiplier: VisualMultiplier = {
  size: 1.2,
  borderWidth: 1.2,
};

export const multiplyVisuals = (visuals: VisualProperties, multiplier: VisualMultiplier = selectedVisualMultiplier) => {
  if (visuals.size !== undefined && multiplier.size !== undefined) {
    visuals.size *= multiplier.size;
  }
  if (visuals.borderWidth !== undefined && multiplier.borderWidth !== undefined) {
    visuals.borderWidth *= multiplier.borderWidth;
  }
  if (visuals.opacity !== undefined && multiplier.opacity !== undefined) {
    visuals.opacity *= multiplier.opacity;
  }
};
