import { loadDesignerWasm, type DesignerWasm } from "./designer";

export type DesignerPointerDebugState = {
    x: number;
    y: number;
    pageX: number;
    pageY: number;
    buttons: number;
    isDown: boolean;
    inside: boolean;
};

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

    pointerDown: (
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
    ) => void;
    pointerMove: (
        x: number,
        y: number,
        buttons: number,
        modifiers: number,
    ) => void;
    pointerUp: (
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
    ) => void;
    pointerCancel: () => void;
    pointerLeave: () => void;
    pointerModifiers: (event: PointerEvent) => number;

    clearSelection(): void;
    selectionCount(): number;
    selectionIdAt(index: number): boolean;
    selectionContains(id: number): boolean;
    getSelectionIds(): number[];

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
    addFullRect: (
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: { r: number; g: number; b: number; a: number },
        strokeColor: { r: number; g: number; b: number; a: number },
        strokeWidth: number,
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
        return wasm.exports.designer_is_initialzied() !== 0;
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

    function pointerDown(
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
    ): void {
        wasm.exports.designer_pointer_down(x, y, button, buttons, modifiers);
        wasm.exports.designer_pointer_down_interaction();
    }

    function pointerMove(
        x: number,
        y: number,
        buttons: number,
        modifiers: number,
    ): void {
        wasm.exports.designer_pointer_move(x, y, buttons, modifiers);
        wasm.exports.designer_pointer_move_interaction()
    }

    function pointerUp(
        x: number,
        y: number,
        button: number,
        buttons: number,
        modifiers: number,
    ): void {
        wasm.exports.designer_pointer_up(x, y, button, buttons, modifiers);
        wasm.exports.designer_pointer_up_interaction()
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

    function selectionCount(): number {
        return wasm.exports.designer_selection_count();
    }

    function selectionIdAt(index: number): boolean {
        return wasm.exports.designer_selection_id_at(index) !== 0;
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

    function addFullRect(
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: { r: number; g: number; b: number; a: number },
        strokeColor: { r: number; g: number; b: number; a: number },
        strokeWidth: number,
    ): number {
        return wasm.exports.designer_add_full_rect(
            x,
            y,
            width,
            height,
            fillColor.r,
            fillColor.g,
            fillColor.b,
            fillColor.a,
            strokeColor.r,
            strokeColor.g,
            strokeColor.b,
            strokeColor.a,
            strokeWidth,
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
        getTransform,
        pointerDown,
        pointerMove,
        pointerUp,
        pointerCancel,
        pointerLeave,
        pointerModifiers,
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
        addFullRect,
        addLine,
        getFirstObjectBounds,
        debugHitTestCurrentPointer,
        debugHitTestPoint,
        clearSelection,
        selectionContains,
        selectionIdAt,
        selectionCount,
        getSelectionIds,
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
