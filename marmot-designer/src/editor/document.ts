export type ObjectId = number;

export type Rgba = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type StrokeStyle = {
    color: Rgba,
    width: number,
};

export type RectObject = {
    id: ObjectId,
    kind: "rect",
    name: string,

    x: number;
    y: number;
    width: number;
    height: number;

    fill: Rgba | null;
    stroke: StrokeStyle | null;
};

export type LineObject = {
    id: ObjectId,
    kind: "line",
    name: string,

    x1: number;
    y1: number;
    x2: number;
    y2: number;

    stroke: StrokeStyle;
};

export type EditorObject = RectObject | LineObject;

export type Page = {
    width: number;
    height: number;
};

export type EditorDocument = {
    page: Page,
    objects: EditorObject[];
};

export type Selection =
    | { kind: "none" }
    | { kind: "object", objectId: ObjectId };
