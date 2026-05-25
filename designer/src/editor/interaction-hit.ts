import type { EditorObject, ObjectId } from "./document";
import type { ResizeHandleId } from "./handles";

export type InteractionHit =
    | { kind: "none" }
    | {
        kind: "object";
        objectId: ObjectId;
        object: EditorObject;
    }
    | {
        kind: "resize_handle";
        objectId: ObjectId;
        handleId: ResizeHandleId;
    };
