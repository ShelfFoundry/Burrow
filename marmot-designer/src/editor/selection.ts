import type { EditorDocument, EditorObject, ObjectId, Selection } from "./document";
import { rectFromLine, type Rect } from "./geometry";

export type RectEditableProperty = "x" | "y" | "width" | "height";

export type SelectedObjectSnapshot =
    | { kind: "none" }
    | {
        kind: "rect";
        id: number;
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }
    | {
        kind: "line";
        id: number;
        name: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };

export function objectToSelectedObjectSnapshot(
    object: EditorObject,
): SelectedObjectSnapshot {
    switch (object.kind) {
        case "rect":
            return {
                kind: "rect",
                id: object.id,
                name: object.name,
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
            };

        case "line":
            return {
                kind: "line",
                id: object.id,
                name: object.name,
                x1: object.x1,
                y1: object.y1,
                x2: object.x2,
                y2: object.y2,
            };
    }
}

export function selectionToSelectedObjectSnapshot(
    document: EditorDocument,
    selection: Selection,
): SelectedObjectSnapshot {
    const object = getSelectedObject(document, selection);
    if (!object) {
        return { kind: "none"};
    }
    return objectToSelectedObjectSnapshot(object);
}

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
