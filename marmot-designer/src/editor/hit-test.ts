import type { EditorDocument, EditorObject, LineObject, ObjectId, RectObject } from "./document"
import { distanceToSegment, pointInRect, type Point, type Rect } from "./geometry";

export type HitTestResult =
    | { kind: "none" }
    | {
        kind: "object", objectId: ObjectId,
        object: EditorObject
    };

export type HitTestOptions = {
    tolerance: number;
};

export function hitTestDocument(
    document: EditorDocument,
    point: Point,
    options: HitTestOptions,
): HitTestResult {
    for (let index = document.objects.length - 1; index >= 0; index -= 1) {
        const object = document.objects[index];

        if (hitTestObject(point, object, options)) {
            return {
                kind: "object",
                objectId: object.id,
                object,
            };
        }
    }

    return { kind: "none" };
}

function hitTestRectObject(point: Point, object: RectObject): boolean {
    const rect: Rect = {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
    };
    return pointInRect(point, rect);
}

function hitTestObject(point: Point, object: EditorObject, options: HitTestOptions): boolean {
    switch (object.kind) {
        case "rect":
            return hitTestRectObject(point, object);
        case "line":
            return hitTestLineObject(point, object, options.tolerance);
    }
}

function hitTestLineObject(
    point: Point,
    object: LineObject,
    tolerance: number,
): boolean {
    const lineStart: Point = {
        x: object.x1,
        y: object.y1,
    };

    const lineEnd: Point = {
        x: object.x2,
        y: object.y2,
    };

    const distance = distanceToSegment(point, lineStart, lineEnd);
    const effectiveTolerance = Math.max(tolerance, object.stroke.width / 2);
    return distance <= effectiveTolerance;
}
