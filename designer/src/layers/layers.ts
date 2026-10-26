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

// The engine has no groups yet, so every object is a top-level layer. Documents
// list objects back to front; the panel shows them front to back.
export function layersFromObjects(objects: { id: number; kind: LayerKind; name: string }[]): LayerNode[] {
    return objects.map(({ id, kind, name }) => ({ id, kind, name })).reverse();
}

// Equal if the panel would draw the same rows. Lets the layer list skip
// revisions that only moved objects around the canvas.
export function layerTreesEqual(a: LayerNode[], b: LayerNode[]): boolean {
    return (
        a.length === b.length &&
        a.every((node, i) => {
            const other = b[i];
            return (
                node.id === other.id &&
                node.kind === other.kind &&
                node.name === other.name &&
                layerTreesEqual(node.children ?? [], other.children ?? [])
            );
        })
    );
}

export function findLayer(nodes: LayerNode[], id: LayerId): LayerNode | undefined {
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = node.children && findLayer(node.children, id);
        if (found) return found;
    }
    return undefined;
}
