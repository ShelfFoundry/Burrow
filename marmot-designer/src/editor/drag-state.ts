import { cloneEditorObject, type EditorObject, type ObjectId } from "./document";
import type { Point } from "./geometry";
import type { ResizeHandleId } from "./handles";

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
