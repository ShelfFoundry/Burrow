import type { EditorDocument, EditorObject, ObjectId, Selection } from "./document";
import { rectFromLine, type Rect } from "./geometry";

export type SelectionSummary =
    | {
        kind: "none"
    }
    | {
        kind: "object";
        id: number;
        objectType: "rect" | "line" | "image" | "text";
        x: number;
        y: number;
        width: number;
        height: number;
    };

export function selectionsEqual(a: Selection, b: Selection): boolean {
    if (a.kind !== b.kind) {
        return false;
    }

    if (a.kind === "none" && b.kind === "none") {
        return true;
    }

    if (a.kind === "object" && b.kind == "object") {
        return a.objectId === b.objectId;
    }

    return false;
}

export function findObjectById(
    document: EditorDocument,
    objectId: ObjectId,
): EditorObject | undefined {
    return document.objects.find((object) => object.id === objectId);
}

export function getSelectedObject(
    document: EditorDocument,
    selection: Selection,
): EditorObject | undefined {
    if (selection.kind !== "object") {
        return undefined;
    }
    return findObjectById(document, selection.objectId);
}

export function getObjectPageBounds(object: EditorObject): Rect {
    switch (object.kind) {
        case "rect":
            return {
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
            };
        case "line":
            return rectFromLine(
                object.x1, object.y1,
                object.x2, object.y2,
                object.stroke.width,
            );
    }
}

export function getSelectedObjectPageBounds(
    document: EditorDocument,
    selection: Selection,
): Rect | undefined {
    const object = getSelectedObject(document, selection);
    if (!object) return undefined;
    return getObjectPageBounds(object);
}

export function objectToSelectionSummary(object: EditorObject): SelectionSummary {
    switch (object.kind) {
        case "rect":
            return {
                kind: "object",
                id: object.id,
                objectType: object.kind,
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
            };

        case "line":
            return {
                kind: "object",
                id: object.id,
                objectType: object.kind,
                x: object.x1,
                y: object.y1,
                width: object.x2 - object.x1,
                height: object.y2 - object.y1,
            };
    }
}

export function selectionToSummary(
    document: EditorDocument,
    selection: Selection,
): SelectionSummary {
    const object = getSelectedObject(document, selection);
    if (!object) {
        return { kind: "none" };
    }
    return objectToSelectionSummary(object);
}
