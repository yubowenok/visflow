interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

// Point stores coordinates of top-left corner (x is towards right, y is towards bottom)
interface Box extends Point, Size {}
