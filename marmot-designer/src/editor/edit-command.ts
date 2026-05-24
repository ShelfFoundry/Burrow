import type {
    EditorDocument,
    EditorObject,
    ObjectId,
} from "./document";
import {
    cloneEditorObject,
    editorObjectEqual,
} from "./document";
import {
    findObjectById,
} from "./selection";
import {
    replaceObjectById,
} from "./object-mutations";

export type EditCommand =
    | {
        kind: "replace_object";
        objectId: ObjectId;
        before: EditorObject;
        after: EditorObject;
    };

export function applyEditCommand(
    document: EditorDocument,
    command: EditCommand,
): boolean {
    switch (command.kind) {
        case "replace_object":
            return replaceObjectById(
                document,
                command.objectId,
                cloneEditorObject(command.after),
            );
    }
}

export function undoEditCommand(
    document: EditorDocument,
    command: EditCommand,
): boolean {
    switch (command.kind) {
        case "replace_object":
            return replaceObjectById(
                document,
                command.objectId,
                cloneEditorObject(command.before),
            );
    }
}

export function createReplaceObjectCommand(
    document: EditorDocument,
    objectId: ObjectId,
    before: EditorObject,
): EditCommand | undefined {
    const currentObject = findObjectById(document, objectId);
    if (!currentObject) {
        return undefined;
    }
    if (editorObjectEqual(before, currentObject)) {
        return undefined;
    }
    return {
        kind: "replace_object",
        objectId,
        before: cloneEditorObject(before),
        after: cloneEditorObject(currentObject),
    };
}
