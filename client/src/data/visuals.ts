import { hsl, rgb } from 'd3-color';

export enum VisualPropertyType {
  COLOR = 'color',
  BORDER = 'border',
  SIZE = 'size',
  WIDTH = 'width',
  OPACITY = 'opacity',
}

export interface VisualProperties {
  color?: string;
  border?: string;
  size?: number;
  width?: number;
  opacity?: number;
  [prop: string]: number | string | undefined;
}

export const isNumericalVisual = (type: VisualPropertyType): boolean => {
  return type === VisualPropertyType.SIZE ||
    type === VisualPropertyType.WIDTH ||
    type === VisualPropertyType.OPACITY;
};

/**
 * Gets an array as the compare key of visual properties.
 */
const visualsComparatorKey = (visuals: VisualProperties): Array<number | string>  => {
  let result: Array<string | number> = [];
  [
    VisualPropertyType.COLOR,
    VisualPropertyType.BORDER,
    VisualPropertyType.WIDTH,
    VisualPropertyType.OPACITY,
  ].forEach(key => {
    const p = key in visuals ? visuals[key] as number | string : '';
    if (key === VisualPropertyType.COLOR) {
      const color = hsl(rgb('' + p));
      result = result.concat([
        color.h || 0,
        color.s || 0,
        color.l || 0,
      ]);
    } else {
      result.push(p);
    }
  });
  return result;
};

/**
 * Compares two visuals.
 */
export const visualsComparator = (a: VisualProperties, b: VisualProperties): number => {
  const aKey = visualsComparatorKey(a);
  const bKey = visualsComparatorKey(b);
  if (aKey.length !== bKey.length) {
    console.warn('two visuals have different comparator key length');
  }
  const length = Math.min(aKey.length, bKey.length);
  for (let i = 0; i < length; i++) {
    if (aKey[i] === bKey[i]) {
      continue;
    }
    return aKey[i] < bKey[i] ? -1 : 1;
  }
  return 0;
};
