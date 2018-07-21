// TODO: use NodeLocation to replace (x, y, width, height) tuple?
export interface NodeLocation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeSave {
  id: string;
  type: string;
  layer: number;
  label: string;
  x: number;
  y: number;
  isIconized: boolean;
  isInVisMode: boolean;
  isLabelVisible: boolean;

  dataflowX: number;
  dataflowY: number;
  dataflowHeight: number;
  dataflowWidth: number;
  visModeX: number;
  visModeY: number;
  visModeWidth: number;
  visModeHeight: number;
}
