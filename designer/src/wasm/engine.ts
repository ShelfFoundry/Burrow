import { loadDesignerWasm, type DesignerWasm } from "./designer";

export type ViewportPointerEventKind =
    | "pointer_down"
    | "pointer_move"
    | "pointer_up"
    | "pointer_cancel"
    | "pointer_leave";

export type ViewportPointerEvent = {
    kind: ViewportPointerEventKind,
    pointerId: number,

    // NOTE: canvas-local x/y in backing-buffer pixels
    x: number,
    y: number,

    buttons: number;
    button: number;

    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
};

export type DesignerPointerDebugState = {
    x: number;
    y: number;
    pageX: number;
    pageY: number;
    buttons: number;
    isDown: boolean;
    inside: boolean;
};

// NOTE: must match the order of Object_Kind in engine/document.odin
const OBJECT_KIND_RECT = 0;
const OBJECT_KIND_LINE = 1;

// NOTE: must match the order of Selection_Mode in engine/selection.odin
const SELECTION_MODES = { replace: 0, toggle: 1 } as const;

export type SelectionMode = keyof typeof SELECTION_MODES;

// NOTE: must match the order of Tool in engine/engine.odin
const ENGINE_TOOLS = ["select", "rect", "line", "pan"] as const;

export type EngineTool = (typeof ENGINE_TOOLS)[number];

export type DocumentObjectKind = "rect" | "line";

// A document object as the layers panel lists it.
export type DocumentObject = {
    id: number;
    kind: DocumentObjectKind;
    name: string;
};

function objectKindFromOrdinal(kind: number): DocumentObjectKind | undefined {
    if (kind === OBJECT_KIND_RECT) return "rect";
    if (kind === OBJECT_KIND_LINE) return "line";
    return undefined;
}

// Placeholder names until the engine stores real ones (name_id is temporary).
function objectName(kind: DocumentObjectKind, nameId: number): string {
    return `${kind === "rect" ? "Rect" : "Line"} ${nameId}`;
}

// NOTE: must match the order of Interaction_Result_Kind in engine/interaction.odin
const INTERACTION_RESULT_KINDS = [
    "none",
    "selection_changed",
    "resize_handle",
    "line_handle",
    "move_selection",
    "creating_rect",
    "creating_line",
    "object_created",
    "document_full",
] as const;

export type InteractionResultKind = (typeof INTERACTION_RESULT_KINDS)[number];

export type RectEditableProperty = "x" | "y" | "width" | "height";

export type SelectedObjectSnapshot =
    | { kind: "none" }
    | { kind: "multiple"; count: number }
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

export function selectedObjectSnapshotsEqual(
    a: SelectedObjectSnapshot,
    b: SelectedObjectSnapshot,
): boolean {
    if (a.kind !== b.kind) {
        return false;
    }

    const aFields = a as Record<string, unknown>;
    const bFields = b as Record<string, unknown>;

    return Object.keys(aFields).every((key) => aFields[key] === bFields[key]);
}

export type Engine = {
    wasm: DesignerWasm;

    init: (width: number, height: number) => boolean;
    resize: (width: number, height: number) => void;
    fitPageToView: () => void;
    frame: () => number;

    isInitialized: () => boolean;

    getViewportSize: () => {
        width: number;
        height: number;
    };

    getPageSize: () => {
        width: number;
        height: number;
    };

    getTransform: () => {
        zoom: number;
        panX: number;
        panY: number;
    };

    getObjectCount: () => number;
    // In document order, back to front.
    getObjects: () => DocumentObject[];
    getDocumentRevision: () => number;

    // interact = false only updates the engine's pointer state, skipping
    // selection/move/resize, e.g. during an interim JS-side creation. Each returns
    // the interaction's result kind, or undefined when interact is false.
    pointerDown: (
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
        interact?: boolean,
    ) => InteractionResultKind | undefined;
    pointerMove: (
        x: number,
        y: number,
        buttons: number,
        modifiers: number,
        interact?: boolean,
    ) => InteractionResultKind | undefined;
    pointerUp: (
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
        interact?: boolean,
    ) => InteractionResultKind | undefined;
    getLastInteractionObjectId: () => number;
    pointerCancel: () => void;
    pointerLeave: () => void;
    pointerModifiers: (event: PointerEvent) => number;
    getPointerPagePosition: () => { x: number; y: number };

    clearSelection(): void;
    selectionCount(): number;
    selectionIdAt(index: number): number;
    selectionContains(id: number): boolean;
    getSelectionIds(): number[];
    getSelectedObjectSnapshot(): SelectedObjectSnapshot;
    selectObjectById(id: number, mode: SelectionMode): boolean;
    setTool(tool: EngineTool): boolean;
    getTool(): EngineTool | undefined;
    setRectGeometry: (
        id: number,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => boolean;

    clearFrame: () => boolean;
    renderDocument: () => boolean;
    clearObjects: () => void;
    addRect: (
        x: number,
        y: number,
        width: number,
        height: number,
        color: { r: number; g: number; b: number; a: number },
    ) => number;
    addLine: (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: { r: number; g: number; b: number; a: number },
        width: number,
    ) => number;

    isGpuInitializeid: () => boolean;
    hasGpuSurface: () => boolean;
    hasGpuAdapter: () => boolean;
    hasGpuDevice: () => boolean;
    hasGpuQueue: () => boolean;
    configureGpuSurface: (width: number, height: number) => boolean;
    isGpuSurfaceConfigured: () => boolean;
    getFirstObjectBounds: () => {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    debugHitTestCurrentPointer: () => {
        kind: number;
        objectId: number;
    };
    debugHitTestPoint: (pageX: number, pageY: number) => number;
    getPointerDebugState: () => DesignerPointerDebugState;
    debugInteractionHit: () => unknown;
};

export async function createEngine(): Promise<Engine> {
    const wasm = await loadDesignerWasm();

    function init(width: number, height: number): boolean {
        return wasm.exports.designer_init(width, height) !== 0;
    }

    function resize(width: number, height: number): void {
        return wasm.exports.designer_resize(width, height);
    }

    function fitPageToView(): void {
        return wasm.exports.designer_fit_page_to_viewport();
    }

    function frame(): number {
        return wasm.exports.designer_frame();
    }

    function isInitialized(): boolean {
        return wasm.exports.designer_is_initialized() !== 0;
    }

    function getViewportSize() {
        return {
            width: wasm.exports.designer_viewport_width(),
            height: wasm.exports.designer_viewport_height(),
        };
    }

    function getPageSize() {
        return {
            width: wasm.exports.designer_page_width(),
            height: wasm.exports.designer_page_height(),
        };
    }

    function getTransform() {
        return {
            zoom: wasm.exports.designer_zoom(),
            panX: wasm.exports.designer_pan_x(),
            panY: wasm.exports.designer_pan_y(),
        };
    }

    function getObjectCount(): number {
        return wasm.exports.designer_object_count();
    }

    function getObjects(): DocumentObject[] {
        const count = wasm.exports.designer_object_count();
        const objects: DocumentObject[] = [];

        for (let i = 0; i < count; i += 1) {
            const id = wasm.exports.designer_object_id_at(i);
            const kind = objectKindFromOrdinal(wasm.exports.designer_object_kind(id));
            if (id === 0 || !kind) continue;

            objects.push({ id, kind, name: objectName(kind, wasm.exports.designer_object_name_id(id)) });
        }

        return objects;
    }

    function getDocumentRevision(): number {
        return wasm.exports.designer_document_revision();
    }

    function pointerDown(
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
        interact = true,
    ): InteractionResultKind | undefined {
        wasm.exports.designer_pointer_down(x, y, button, buttons, modifiers);
        if (!interact) return undefined;
        return INTERACTION_RESULT_KINDS[wasm.exports.designer_pointer_down_interaction()];
    }

    function pointerMove(
        x: number,
        y: number,
        buttons: number,
        modifiers: number,
        interact = true,
    ): InteractionResultKind | undefined {
        wasm.exports.designer_pointer_move(x, y, buttons, modifiers);
        if (!interact) return undefined;
        return INTERACTION_RESULT_KINDS[wasm.exports.designer_pointer_move_interaction()];
    }

    function pointerUp(
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
        interact = true,
    ): InteractionResultKind | undefined {
        wasm.exports.designer_pointer_up(x, y, button, buttons, modifiers);
        if (!interact) return undefined;
        return INTERACTION_RESULT_KINDS[wasm.exports.designer_pointer_up_interaction()];
    }

    function getLastInteractionObjectId(): number {
        return wasm.exports.designer_last_interaction_object_id();
    }

    function pointerCancel(): void {
        wasm.exports.designer_pointer_cancel();
    }

    function pointerLeave(): void {
        wasm.exports.designer_pointer_leave();
    }

    function pointerModifiers(event: PointerEvent): number {
        let modifiers = 0;

        if (event.ctrlKey) modifiers |= 1;
        if (event.shiftKey) modifiers |= 2;
        if (event.altKey) modifiers |= 4;
        if (event.metaKey) modifiers |= 8;

        return modifiers;
    }

    function getPointerPagePosition() {
        return {
            x: wasm.exports.designer_pointer_page_x(),
            y: wasm.exports.designer_pointer_page_y(),
        };
    }

    function selectionCount(): number {
        return wasm.exports.designer_selection_count();
    }

    function selectionIdAt(index: number): number {
        return wasm.exports.designer_selection_id_at(index);
    }

    function selectionContains(id: number): boolean {
        return wasm.exports.designer_selection_contains(id) !== 0;
    }

    function getSelectionIds(): number[] {
        const count = wasm.exports.designer_selection_count();
        const ids: number[] = [];

        for (let i = 0; i < count; i += 1) {
            const id = wasm.exports.designer_selection_id_at(i);
            if (id !== 0) ids.push(id);
        }

        return ids;
    }

    function clearSelection() {
        return wasm.exports.designer_clear_selection();
    }

    function getSelectedObjectSnapshot(): SelectedObjectSnapshot {
        const ids = getSelectionIds();

        if (ids.length === 0) {
            return { kind: "none" };
        }

        if (ids.length > 1) {
            return { kind: "multiple", count: ids.length };
        }

        const id = ids[0];
        const kind = wasm.exports.designer_object_kind(id);
        const nameId = wasm.exports.designer_object_name_id(id);

        if (kind === OBJECT_KIND_RECT) {
            return {
                kind: "rect",
                id,
                name: objectName("rect", nameId),
                x: wasm.exports.designer_object_rect_x(id),
                y: wasm.exports.designer_object_rect_y(id),
                width: wasm.exports.designer_object_rect_width(id),
                height: wasm.exports.designer_object_rect_height(id),
            };
        }

        if (kind === OBJECT_KIND_LINE) {
            return {
                kind: "line",
                id,
                name: objectName("line", nameId),
                x1: wasm.exports.designer_object_line_x1(id),
                y1: wasm.exports.designer_object_line_y1(id),
                x2: wasm.exports.designer_object_line_x2(id),
                y2: wasm.exports.designer_object_line_y2(id),
            };
        }

        return { kind: "none" };
    }

    function selectObjectById(id: number, mode: SelectionMode): boolean {
        return wasm.exports.designer_select_object_by_id(id, SELECTION_MODES[mode]) !== 0;
    }

    function setTool(tool: EngineTool): boolean {
        return wasm.exports.designer_set_tool(ENGINE_TOOLS.indexOf(tool)) !== 0;
    }

    function getTool(): EngineTool | undefined {
        return ENGINE_TOOLS[wasm.exports.designer_tool()];
    }

    function setRectGeometry(
        id: number,
        x: number,
        y: number,
        width: number,
        height: number,
    ): boolean {
        return wasm.exports.designer_set_rect_geometry(id, x, y, width, height) !== 0;
    }

    function getPointerDebugState(): DesignerPointerDebugState {
        return {
            x: wasm.exports.designer_pointer_x(),
            y: wasm.exports.designer_pointer_y(),
            pageX: wasm.exports.designer_pointer_page_x(),
            pageY: wasm.exports.designer_pointer_page_y(),
            buttons: wasm.exports.designer_pointer_buttons(),
            isDown: wasm.exports.designer_pointer_is_down() !== 0,
            inside: wasm.exports.designer_pointer_inside() !== 0,
        };
    }

    function isGpuInitializeid(): boolean {
        return wasm.exports.designer_gpu_is_initialized() !== 0;
    }

    function clearFrame(): boolean {
        return wasm.exports.designer_gpu_clear_frame() !== 0;
    }

    function renderDocument(): boolean {
        return wasm.exports.designer_render_document() !== 0;
    }

    function clearObjects(): void {
        wasm.exports.designer_clear_objects();
    }

    function addLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: { r: number; g: number; b: number; a: number },
        width: number,
    ): number {
        return wasm.exports.designer_add_line(
            x1,
            y1,
            x2,
            y2,
            color.r,
            color.g,
            color.b,
            color.a,
            width,
        );
    }

    function addRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: { r: number; g: number; b: number; a: number },
    ): number {
        return wasm.exports.designer_add_rect(
            x,
            y,
            width,
            height,
            color.r,
            color.g,
            color.b,
            color.a,
        );
    }

    function getFirstObjectBounds() {
        return {
            x: wasm.exports.designer_debug_first_object_bounds_x(),
            y: wasm.exports.designer_debug_first_object_bounds_y(),
            width: wasm.exports.designer_debug_first_object_bounds_width(),
            height: wasm.exports.designer_debug_first_object_bounds_height(),
        };
    }

    function debugHitTestCurrentPointer() {
        return {
            kind: wasm.exports.designer_debug_hit_test_current_pointer_kind(),
            objectId: wasm.exports.designer_debug_hit_test_current_pointer_object_id(),
        };
    }

    function debugHitTestPoint(pageX: number, pageY: number): number {
        return wasm.exports.designer_debug_hit_test_point_object_id(pageX, pageY);
    }

    function hasGpuSurface(): boolean {
        return wasm.exports.designer_gpu_has_surface() !== 0;
    }

    function hasGpuAdapter(): boolean {
        return wasm.exports.designer_gpu_has_adapter() !== 0;
    }

    function hasGpuDevice(): boolean {
        return wasm.exports.designer_gpu_has_device() !== 0;
    }

    function hasGpuQueue(): boolean {
        return wasm.exports.designer_gpu_has_queue() !== 0;
    }

    function configureGpuSurface(width: number, height: number): boolean {
        return wasm.exports.designer_gpu_configure_surface(width, height) !== 0;
    }

    function isGpuSurfaceConfigured(): boolean {
        return wasm.exports.designer_gpu_surface_configured() !== 0;
    }

    function debugInteractionHit() {
        return {
            kind: wasm.exports.designer_debug_interaction_hit_kind(),
            objectId: wasm.exports.designer_debug_interaction_hit_object_id(),
            resizeHandle: wasm.exports.designer_debug_interaction_hit_resize_handle(),
            lineHandle: wasm.exports.designer_debug_interaction_hit_line_handle(),
        };
    }

    return {
        wasm,
        init,
        resize,
        fitPageToView,
        frame,
        isInitialized,
        getViewportSize,
        getPageSize,
        getObjectCount,
        getObjects,
        getDocumentRevision,
        getTransform,
        pointerDown,
        pointerMove,
        pointerUp,
        getLastInteractionObjectId,
        pointerCancel,
        pointerLeave,
        pointerModifiers,
        getPointerPagePosition,
        getPointerDebugState,
        isGpuInitializeid,
        clearFrame,
        hasGpuSurface,
        hasGpuAdapter,
        hasGpuDevice,
        hasGpuQueue,
        configureGpuSurface,
        isGpuSurfaceConfigured,
        renderDocument,
        clearObjects,
        addRect,
        addLine,
        getFirstObjectBounds,
        debugHitTestCurrentPointer,
        debugHitTestPoint,
        clearSelection,
        selectionContains,
        selectionIdAt,
        selectionCount,
        getSelectionIds,
        getSelectedObjectSnapshot,
        selectObjectById,
        setTool,
        getTool,
        setRectGeometry,
        debugInteractionHit,
    };
}

export async function waitForDesignerGpuReady(
    engine: Engine,
    timeoutMs = 3000,
): Promise<boolean> {
    const startedAt = performance.now();

    while (performance.now() - startedAt < timeoutMs) {
        if (
            engine.hasGpuSurface() &&
            engine.hasGpuAdapter() &&
            engine.hasGpuDevice() &&
            engine.hasGpuQueue()
        ) {
            return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 16));
    }

    return false;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
    const devicePixelRatio = window.devicePixelRatio || 1;

    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * devicePixelRatio));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * devicePixelRatio));

    const needsResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needsResize) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needsResize;
}
