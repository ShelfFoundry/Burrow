import type { EditorDocument, EditorObject, ObjectId, RectObject } from "./document"
import { pointInRect, type Point, type Rect } from "./geometry";

export type HitTestResult =
    | { kind: "none" }
    | {
        kind: "object", objectId: ObjectId,
        object: EditorObject
    };

function hitTestRectObject(point: Point, object: RectObject): boolean {
    const rect: Rect = {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
    };
    return pointInRect(point, rect);
}

function hitTestObject(point: Point, object: EditorObject): boolean {
    switch (object.kind) {
        case "rect":
            return hitTestRectObject(point, object);
        case "line":
            return false;
    }
}

export function hitTestDocument(
    document: EditorDocument,
    point: Point
): HitTestResult {
    for (let index = document.objects.length - 1; index >= 0; index -= 1) {
        const object = document.objects[index];

        if (hitTestObject(point, object)) {
            return {
                kind: "object",
                objectId: object.id,
                object,
            };
        }
    }

    return { kind: "none" };
}
