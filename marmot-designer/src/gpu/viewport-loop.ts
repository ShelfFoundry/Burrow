import type { EditorDocument } from "../editor/document";
import { computeInitialViewport, screenToPage, type PagePlacement, type Point, type ViewportTransform } from "../editor/geometry";
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

    const rectRenderer: RectRenderer = createRectRenderer(gpuState);
    const pageRenderer: PageRenderer = createPageRenderer();
    const objectRenderer: ObjectRenderer = createObjectRenderer();

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

    function getSelection(): Selection {
        return selection;
    }

    function selectionEqual(a: Selection, b: Selection): boolean {
        if (a.kind !== b.kind) {
            return false;
        }

        if (a.kind === "none" && b.kind === "none") {
            return true;
        }

        if (a.kind === "object" && b.kind == "object") {
            return a.objectId === b.objectId;
        }

        return false;
    }

    function setSelection(nextSelection: Selection, hit: HitTestResult) {
        const changed = !selectionEqual(selection, nextSelection);
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

                const hit = hitTestDocument(document, {
                    x: pointer.pageX,
                    y: pointer.pageY,
                });

                if (hit.kind === "object") {
                    setSelection({ kind: "object", objectId: hit.objectId }, hit);
                } else {
                    setSelection({ kind: "none" }, hit);
                }
                break;
            case "pointer_move":
                pointer.inside = true;
                pointer.isDown = event.buttons !== 0;
                break;
            case "pointer_up":
                pointer.inside = true;
                pointer.isDown = false;
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

            rectRenderer.render(frameState.pass, [...pageRects, ...objectRects], canvas.width, canvas.height);

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
    };
}
