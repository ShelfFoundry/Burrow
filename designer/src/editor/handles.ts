import type { Rect, Point } from "./geometry";
import { pointInRect } from "./geometry";

export const RESIZE_HANDLE_SIZE = 8;

export type ResizeHandleId =
    | "nw"
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w";

export type ResizeHandle = {
    id: ResizeHandleId;
    x: number;
    y: number;
};

export type ResizeHandleHit = {
    handleId: ResizeHandleId,
};

export function hitTestResizeHandles(
    point: Point,
    bounds: Rect,
    handleSize: number,
): ResizeHandleHit | undefined {
    const handles = getResizeHandlesForScreenRect(bounds);
    for (let index = handles.length - 1; index >= 0; index -= 1) {
        const handle = handles[index];
        const handleRect = squareRectFromCenter(handle.x, handle.y, handleSize);
        if (pointInRect(point, handleRect)) {
            return {
                handleId: handle.id,
            };
        }
    }
    return undefined;
}

export function getResizeHandlesForScreenRect(rect: Rect): ResizeHandle[] {
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.width;
    const y1 = rect.y + rect.height;

    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    return [
        { id: "nw", x: x0, y: y0 },
        { id: "n", x: cx, y: y0 },
        { id: "ne", x: x1, y: y0 },
        { id: "e", x: x1, y: cy },
        { id: "se", x: x1, y: y1 },
        { id: "s", x: cx, y: y1 },
        { id: "sw", x: x0, y: y1 },
        { id: "w", x: x0, y: cy },
    ];
}

export function squareRectFromCenter(
    centerX: number,
    centerY: number,
    size: number,
): Rect {
    const half = size / 2;
    return {
        x: centerX - half,
        y: centerY - half,
        width: size,
        height: size,
    };
}
