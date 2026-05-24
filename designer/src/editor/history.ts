import type { EditorDocument } from "./document";
import type { EditCommand } from "./edit-command";
import {
    applyEditCommand,
    undoEditCommand,
} from "./edit-command";

export type EditorHistory = {
    undoStack: EditCommand[];
    redoStack: EditCommand[];
};

export function createEditorHistory(): EditorHistory {
    return {
        undoStack: [],
        redoStack: [],
    };
}

export function commitCommand(
    history: EditorHistory,
    command: EditCommand | undefined
): boolean {
    if (!command) {
        return false;
    }
    history.undoStack.push(command);
    history.redoStack = [];
    return true;
}

export function undo(
    document: EditorDocument,
    history: EditorHistory,
): boolean {
    const command = history.undoStack.pop();
    if (!command) {
        return false;
    }
    const ok = undoEditCommand(document, command);
    if (!ok) {
        return false;
    }
    history.redoStack.push(command);
    return true;
}

export function redo(
    document: EditorDocument,
    history: EditorHistory
): boolean {
    const command = history.redoStack.pop();
    if (!command) {
        return false;
    }
    const ok = applyEditCommand(document, command);
    if (!ok) {
        return false;
    }
    history.undoStack.push(command);
    return true;
}
