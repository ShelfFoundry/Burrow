import { cloneEditorObject, type EditorDocument, type EditorObject, type ObjectId } from "./document";
import type { Point } from "./geometry";
import type { ResizeHandleId } from "./handles";
import { moveObjectByDelta, replaceObjectById, resizeRectObjectFromHandle } from "./object-mutations";

export type DragState =
    | {
        kind: "idle";
    }
    | {
        kind: "move";
        objectId: ObjectId;
        startPagePoint: Point;
        currentPagePoint: Point;
        originalObject: EditorObject;
    }
    | {
        kind: "resize";
        objectId: ObjectId;
        handleId: ResizeHandleId;
        startPagePoint: Point;
        currentPagePoint: Point;
        originalObject: EditorObject;
    };

export function createIdleDragState(): DragState {
    return { kind: "idle" };
}

export function createMoveDragState(
    object: EditorObject,
    startPagePoint: Point,
): DragState {
    return {
        kind: "move",
        objectId: object.id,
        startPagePoint,
        currentPagePoint: startPagePoint,
        originalObject: cloneEditorObject(object),
    };
}

export function createResizeDragState(
    object: EditorObject,
    handleId: ResizeHandleId,
    startPagePoint: Point
): DragState {
    return {
        kind: "resize",
        objectId: object.id,
        handleId,
        startPagePoint,
        currentPagePoint: startPagePoint,
        originalObject: cloneEditorObject(object),
    };
}

export function updateDragCurrentPoint(
    dragState: DragState,
    currentPagePoint: Point,
): DragState {
    switch (dragState.kind) {
        case "idle":
            return dragState;
        case "move":
            return {
                ...dragState,
                currentPagePoint,
            };
        case "resize":
            return {
                ...dragState,
                currentPagePoint,
            };
    }
}

export function getDragDelta(dragState: DragState): Point {
    switch (dragState.kind) {
        case "idle":
            return { x: 0, y: 0 };
        case "move":
        case "resize":
            return {
                x: dragState.currentPagePoint.x - dragState.startPagePoint.x,
                y: dragState.currentPagePoint.y - dragState.startPagePoint.y,
            };
    }
}

export function applyMoveDrag(document: EditorDocument, dragState: DragState): boolean {
    if (dragState.kind !== "move") {
        return false;
    }
    const delta = getDragDelta(dragState);
    const movedObject = moveObjectByDelta(
        dragState.originalObject,
        delta.x,
        delta.y,
    );
    return replaceObjectById(
        document,
        dragState.objectId,
        movedObject,
    );
}

export function applyResizeDrag(
    document: EditorDocument,
    dragState: DragState,
): boolean {
    if (dragState.kind !== "resize") {
        return false;
    }
    if (dragState.originalObject.kind !== "rect") {
        return false;
    }
    const delta = getDragDelta(dragState);
    const resizedObject = resizeRectObjectFromHandle(
        dragState.originalObject,
        dragState.handleId,
        delta.x,
        delta.y,
    );
    return replaceObjectById(
        document,
        dragState.objectId,
        resizedObject,
    );
}
