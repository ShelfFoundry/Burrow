import type { EditorDocument, EditorObject, LineObject, ObjectId, RectObject } from "./document"
import { distanceToSegment, pagePointToTranslatedLocal, pointInRect, type Point, type Rect } from "./geometry";

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
    const localPoint = pagePointToTranslatedLocal(
        point, object.x, object.y,
    );

    const localBounds: Rect = {
        x: 0,
        y: 0,
        width: object.width,
        height: object.height,
    };

    return pointInRect(localPoint, localBounds);
}

function hitTestObject(point: Point, object: EditorObject, options: HitTestOptions): boolean {
    const bounds = getObjectPageBounds(object, options);
    if (!pointInRect(point, bounds)) {
        return false;
    }
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

function getRectObjectPageBounds(object: RectObject): Rect {
    return {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
    };
}

function getLineObjectPageBounds(object: LineObject, tolerance: number): Rect {
    const x0 = Math.min(object.x1, object.x2) - tolerance;
    const y0 = Math.min(object.y1, object.y2) - tolerance;
    const x1 = Math.max(object.x1, object.x2) + tolerance;
    const y1 = Math.max(object.y1, object.y2) + tolerance;

    return {
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
    };
}

function getObjectPageBounds(
    object: EditorObject,
    options: HitTestOptions,
): Rect {
    switch (object.kind) {
        case "rect":
            return getRectObjectPageBounds(object);
        case "line":
            return getLineObjectPageBounds(object, options.tolerance);
    }
}
