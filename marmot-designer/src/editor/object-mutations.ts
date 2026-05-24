import type {
    EditorDocument,
    EditorObject,
    ObjectId,
} from "./document";

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
