import type { EditorDocument, EditorObject } from "../editor/document";
import { computeInitialViewport, pageRectToScreen, screenToPage, type PagePlacement, type Point, type Rect, type ViewportTransform } from "../editor/geometry";
import { createPageRenderer, type PageRenderer } from "./page-renderer";
import { createRectRenderer, type RectRenderer } from "./rect-renderer";
import type { Selection } from "../editor/document";
import {
    beginFrame,
    endFrame,
    resizeCanvasToDisplaySize,
    type WebGpuState,
} from "./webgpu";
import { createObjectRenderer, type ObjectRenderer } from "./object-renderer";
import { hitTestDocument, type HitTestResult } from "../editor/hit-test";
import { findObjectById, getSelectedObject, getSelectedObjectPageBounds, selectionsEqual } from "../editor/selection";
import { createSelectionRenderer, type SelectionRenderer } from "./selection-renderer";
import type { InteractionHit } from "../editor/interaction-hit";
import { hitTestResizeHandles, RESIZE_HANDLE_SIZE } from "../editor/handles";
import { createIdleDragState, createMoveDragState, createResizeDragState, updateDragCurrentPoint, type DragState } from "../editor/drag-state";

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

export type PointerState = {
    x: number,
    y: number,
    pageX: number;
    pageY: number;
    inside: boolean,
    isDown: boolean;
    buttons: number,
    button: number;
    pointerId: number | null;
};

export type ViewportLoopCallbacks = {
    onSelectionChanged?: (selection: Selection, hit: HitTestResult) => void;
    onInteractionHit?: (hit: InteractionHit) => void;
};

export type ViewportLoop = {
    start: () => void;
    stop: () => void;
    markDirty: () => void;
    isRunning: () => boolean;

    handlePointerEvent: (event: ViewportPointerEvent) => void;
    getPointerState: () => PointerState;

    getRenderedFrames: () => number;
    getTransform: () => ViewportTransform;
    getPagePlacement: () => PagePlacement;
    screenToPagePoint: (point: Point) => Point;
    resetViewToFitPage: () => void;

    getSelection: () => Selection;
    getSelectedObject: () => EditorObject | undefined;
    getSelectedObjectPageBounds: () => Rect | undefined;

    getDragState: () => DragState;
};

export function createViewportLoop(
    canvas: HTMLCanvasElement,
    gpuState: WebGpuState,
    document: EditorDocument,
    callbacks: ViewportLoopCallbacks = {},
): ViewportLoop {
    let animationFrameId = 0;
    let running = false;
    let dirty = true;
    let renderedFrames = 0;

    let selection: Selection = { kind: "none" };
    let dragState: DragState = createIdleDragState();

    const rectRenderer: RectRenderer = createRectRenderer(gpuState);
    const pageRenderer: PageRenderer = createPageRenderer();
    const objectRenderer: ObjectRenderer = createObjectRenderer();
    const selectionRenderer: SelectionRenderer = createSelectionRenderer();

    const pointer: PointerState = {
        x: 0,
        y: 0,
        pageX: 0,
        pageY: 0,
        inside: false,
        isDown: false,
        buttons: 0,
        button: -1,
        pointerId: null,
    };

    let transform: ViewportTransform = {
        zoom: 1,
        panX: 0,
        panY: 0,
    };

    let pagePlacement: PagePlacement = {
        x: 0,
        y: 0,
    };

    function getDragState(): DragState {
        return dragState;
    }

    function getSelection(): Selection {
        return selection;
    }

    function getLoopSelectedObject(): EditorObject | undefined {
        return getSelectedObject(document, selection);
    }

    function getLoopSelectedObjectPageBounds(): Rect | undefined {
        return getSelectedObjectPageBounds(document, selection);
    }

    function setSelection(nextSelection: Selection, hit: HitTestResult) {
        const changed = !selectionsEqual(selection, nextSelection);
        selection = nextSelection;
        if (changed) {
            callbacks.onSelectionChanged?.(selection, hit);
            markDirty();
        }
    }

    function getTransform(): ViewportTransform {
        return { ...transform };
    }

    function getPagePlacement(): PagePlacement {
        return { ...pagePlacement };
    }

    function screenToPagePoint(point: Point): Point {
        return screenToPage(point, pagePlacement, transform);
    }

    function resetViewToFitPage() {
        const result = computeInitialViewport(
            {
                width: canvas.width,
                height: canvas.height,
            },
            {
                width: document.page.width,
                height: document.page.height,
            }
        );
        transform = result.transform;
        pagePlacement = result.pagePlacement;
        markDirty();
    }

    function markDirty() {
        dirty = true;
    }

    function hitTestSelectionHandle(screenPoint: Point): InteractionHit {
        if (selection.kind !== "object") {
            return { kind: "none" };
        }
        const selectedBounds = getLoopSelectedObjectPageBounds();
        if (!selectedBounds) {
            return { kind: "none" };
        }
        const screenBounds = pageRectToScreen(
            selectedBounds,
            pagePlacement,
            transform,
        );
        const handleHit = hitTestResizeHandles(
            screenPoint,
            screenBounds,
            RESIZE_HANDLE_SIZE,
        );
        if (!handleHit) {
            return { kind: "none" };
        }
        return {
            kind: "resize_handle",
            objectId: selection.objectId,
            handleId: handleHit.handleId,
        };
    }

    function hitTestInteraction(screenPoint: Point, pagePoint: Point): InteractionHit {
        const handleHit = hitTestSelectionHandle(screenPoint);
        if (handleHit.kind !== "none") {
            return handleHit;
        }
        const screenTolerance = 6;
        const pageTolerance = screenTolerance / transform.zoom;

        const objectHit = hitTestDocument(
            document,
            pagePoint,
            { tolerance: pageTolerance },
        );
        if (objectHit.kind === "object") {
            return {
                kind: "object",
                objectId: objectHit.objectId,
                object: objectHit.object,
            };
        }
        return { kind: "none" };
    }

    function handlePointerEvent(event: ViewportPointerEvent) {
        const pagePoint = screenToPagePoint({
            x: event.x,
            y: event.y,
        });

        pointer.x = event.x;
        pointer.y = event.y;
        pointer.pageX = pagePoint.x;
        pointer.pageY = pagePoint.y;
        pointer.buttons = event.buttons;
        pointer.button = event.button;
        pointer.pointerId = event.pointerId;

        switch (event.kind) {
            case "pointer_down":
                pointer.inside = true;
                pointer.isDown = true;

                const interactionHit = hitTestInteraction(
                    { x: pointer.x, y: pointer.y },
                    { x: pointer.pageX, y: pointer.pageY },
                );
                switch (interactionHit.kind) {
                    case "resize_handle":
                        const object = findObjectById(document, interactionHit.objectId);
                        if (object) {
                            dragState = createResizeDragState(
                                object,
                                interactionHit.handleId,
                                {
                                    x: pointer.pageX,
                                    y: pointer.pageY,
                                }
                            );
                        }

                        callbacks.onInteractionHit?.(interactionHit);
                        markDirty();
                        break;
                    case "object":
                        setSelection(
                            {
                                kind: "object",
                                objectId: interactionHit.objectId,
                            },
                            {
                                kind: "object",
                                objectId: interactionHit.objectId,
                                object: interactionHit.object,
                            }
                        );
                        dragState = createMoveDragState(
                            interactionHit.object,
                            {
                                x: pointer.pageX,
                                y: pointer.pageY,
                            },
                        );
                        callbacks.onInteractionHit?.(interactionHit);
                        break;
                    case "none":
                        dragState = createIdleDragState();
                        setSelection({ kind: "none" }, { kind: "none" });
                        callbacks.onInteractionHit?.(interactionHit);
                        break;
                }
                break;
            case "pointer_move":
                pointer.inside = true;
                pointer.isDown = event.buttons !== 0;
                if (dragState.kind !== "idle") {
                    dragState = updateDragCurrentPoint(dragState, {
                        x: pointer.pageX,
                        y: pointer.pageY,
                    });
                    markDirty();
                }
                break;
            case "pointer_up":
                pointer.inside = true;
                pointer.isDown = false;
                if (dragState.kind !== "idle") {
                    dragState = createIdleDragState();
                    markDirty();
                }
                break;
            case "pointer_leave":
                pointer.inside = false;
                pointer.isDown = event.buttons !== 0;
                break;
            case "pointer_cancel":
                pointer.inside = false;
                pointer.isDown = false;
                pointer.buttons = 0;
                pointer.button = -1;
                pointer.pointerId = null;
                dragState = createIdleDragState();
                break;
        }

        markDirty();
    }

    function getPointerState(): PointerState {
        return { ...pointer };
    }

    function frame() {
        if (!running) {
            return;
        }

        const resized = resizeCanvasToDisplaySize(canvas);
        if (resized) {
            dirty = true;
        }

        if (dirty) {
            const frameState = beginFrame(gpuState);

            const pageRects = pageRenderer.buildRects({
                document,
                transform,
                pagePlacement,
            });

            const objectRects = objectRenderer.buildRects({
                document,
                transform,
                pagePlacement,
            });

            const selectionRects = selectionRenderer.buildRects({
                selection,
                selectedBounds: getLoopSelectedObjectPageBounds(),
                transform,
                pagePlacement,
            });

            rectRenderer.render(frameState.pass, [...pageRects, ...objectRects, ...selectionRects], canvas.width, canvas.height);

            endFrame(gpuState, frameState);

            renderedFrames += 1;
            dirty = false;
        }

        animationFrameId = requestAnimationFrame(frame);
    }

    function start() {
        if (running) {
            return;
        }

        running = true;
        dirty = true;

        resizeCanvasToDisplaySize(canvas);
        resetViewToFitPage();

        animationFrameId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;

        if (animationFrameId !== 0) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    }

    function isRunning() {
        return running;
    }

    function getRenderedFrames() {
        return renderedFrames;
    }

    return {
        start,
        stop,
        markDirty,
        isRunning,
        handlePointerEvent,
        getPointerState,
        getRenderedFrames,
        getTransform,
        getPagePlacement,
        screenToPagePoint,
        resetViewToFitPage,
        getSelection,
        getSelectedObject: getLoopSelectedObject,
        getSelectedObjectPageBounds: getLoopSelectedObjectPageBounds,
        getDragState,
    };
}
