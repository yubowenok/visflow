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
