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
