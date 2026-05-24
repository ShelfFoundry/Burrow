import type {
    EditorDocument,
    EditorObject,
    ObjectId,
    RectObject,
} from "./document";
import type { ResizeHandleId } from "./handles";
import type { RectEditableProperty } from "./selection";

export function setRectObjectPropery(
    object: RectObject,
    property: RectEditableProperty,
    value: number,
    minSize = 8,
): RectObject {
    switch (property) {
        case "x":
            return {
                ...object,
                x: value,
            };

        case "y":
            return {
                ...object,
                y: value,
            };

        case "width":
            return {
                ...object,
                width: Math.max(minSize, value),
            };

        case "height":
            return {
                ...object,
                height: Math.max(minSize, value),
            };
    }
}

export function replaceObjectById(
    document: EditorDocument,
    objectId: ObjectId,
    nextObject: EditorObject,
): boolean {
    const index = document.objects.findIndex((object) => object.id === objectId);

    if (index === -1) {
        return false;
    }

    document.objects[index] = nextObject;
    return true;
}

export function moveObjectByDelta(
    object: EditorObject,
    dx: number,
    dy: number,
): EditorObject {
    switch (object.kind) {
        case "rect":
            return {
                ...object,
                x: object.x + dx,
                y: object.y + dy,
            };
        case "line":
            return {
                ...object,
                x1: object.x1 + dx,
                y1: object.y1 + dy,
                x2: object.x2 + dx,
                y2: object.y2 + dy,
            };
    }
}

export function resizeRectObjectFromHandle(
    object: RectObject,
    handleId: ResizeHandleId,
    dx: number,
    dy: number,
    minSize = 8,
): RectObject {
    let left = object.x;
    let top = object.y;
    let right = object.x + object.width;
    let bottom = object.y + object.height;

    switch (handleId) {
        case "nw":
            left += dx;
            top += dy;
            break;

        case "n":
            top += dy;
            break;

        case "ne":
            right += dx;
            top += dy;
            break;

        case "e":
            right += dx;
            break;

        case "se":
            right += dx;
            bottom += dy;
            break;

        case "s":
            bottom += dy;
            break;

        case "sw":
            left += dx;
            bottom += dy;
            break;

        case "w":
            left += dx;
            break;
    }

    if (right - left < minSize) {
        if (handleId.includes("w")) {
            left = right - minSize;
        } else {
            right = left + minSize;
        }
    }

    if (bottom - top < minSize) {
        if (handleId.includes("n")) {
            top = bottom - minSize;
        } else {
            bottom = top + minSize;
        }
    }

    return {
        ...object,
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
    };
}
