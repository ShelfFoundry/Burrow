// Layer tree types and the intents the layers panel emits.
//
// The panel never changes the tree itself. Reordering, nesting, grouping and
// removing groups that end up empty are document mutations, so they belong to
// the engine. The panel only works out what the user asked for and sends it
// through LayerCommands.

export type LayerId = number;

export type LayerKind = "rect" | "line" | "text" | "image" | "group";

export type LayerNode = {
    id: LayerId;
    name: string;
    kind: LayerKind;
    // Front to back, the order the panel shows them. Only groups have children.
    children?: LayerNode[];
};

// Where a moved layer should end up.
// - parentId: the group to move into, or null for the top level.
// - index: insertion slot among the parent's current children, front to back
//   (0 = frontmost). It counts the moved layer if it's already in that parent,
//   so moving it down one place in the same parent is index + 2.
export type LayerPlacement = {
    parentId: LayerId | null;
    index: number;
};

export type LayerSelectMode = "replace" | "toggle";

export type LayerCommands = {
    select: (id: LayerId, mode: LayerSelectMode) => void;
    // Expected engine behaviour: a group left with no children is deleted.
    move: (id: LayerId, placement: LayerPlacement) => void;
    group: (ids: LayerId[]) => void;
};

// MOCK: the engine doesn't expose a way to list document objects yet.
export const MOCK_LAYERS: LayerNode[] = [
    { id: 1, name: "{{NAME}}", kind: "text" },
    { id: 2, name: "Rectangle 1", kind: "rect" },
    {
        id: 3,
        name: "Group 1",
        kind: "group",
        children: [
            { id: 4, name: "company-logo.jpg", kind: "image" },
            { id: 5, name: "{{BARCODE}}", kind: "text" },
        ],
    },
    { id: 6, name: "Line 1", kind: "line" },
];

export const MOCK_SELECTED_LAYERS: LayerId[] = [1];

export function findLayer(nodes: LayerNode[], id: LayerId): LayerNode | undefined {
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = node.children && findLayer(node.children, id);
        if (found) return found;
    }
    return undefined;
}
