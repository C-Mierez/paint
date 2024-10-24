/* --------------------------------- Global --------------------------------- */
export type Point = {
    x: number;
    y: number;
};

/* --------------------------------- Canvas --------------------------------- */
export enum CanvasMode {
    None,
    Pencil,
    Inserting,
    Erasing,
}

export enum LayerType {
    Rectangle,
    // Ellipse,
}

export type RectangleLayer = {
    type: LayerType.Rectangle;
    x: number;
    y: number;
    height: number;
    width: number;
};

export type LayerState = RectangleLayer;

export type CanvasState =
    | {
          mode: CanvasMode.None;
      }
    | {
          mode: CanvasMode.Pencil | CanvasMode.Erasing;
          lastPoint: Point;
      }
    | {
          mode: CanvasMode.Inserting;
          layerType: LayerType.Rectangle;
      };
