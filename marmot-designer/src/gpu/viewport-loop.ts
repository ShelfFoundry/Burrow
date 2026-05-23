import type { EditorDocument } from "../editor/document";
import { computeInitialViewport, screenToPage, type PagePlacement, type Point, type ViewportTransform } from "../editor/geometry";
import { createPageRenderer, type PageRenderer } from "./page-renderer";
import { createRectRenderer, type RectRenderer } from "./rect-renderer";
import {
    beginFrame,
    endFrame,
    resizeCanvasToDisplaySize,
    type WebGpuState,
} from "./webgpu";
import { createObjectRenderer, type ObjectRenderer } from "./object-renderer";

export type PointerState = {
    x: number,
    y: number,
    inside: boolean,
    buttons: number,
};

export type ViewportLoop = {
    start: () => void;
    stop: () => void;
    markDirty: () => void;
    isRunning: () => boolean;

    pointerMove: (x: number, y: number, buttons: number) => void;
    pointerLeave: () => void;
    getPointerState: () => PointerState;

    getRenderedFrames: () => number;
    getTransform: () => ViewportTransform;
    getPagePlacement: () => PagePlacement;
    screenToPagePoint: (point: Point) => Point;
    resetViewToFitPage: () => void;
};

export function createViewportLoop(
    canvas: HTMLCanvasElement,
    gpuState: WebGpuState,
    document: EditorDocument,
): ViewportLoop {
    let animationFrameId = 0;
    let running = false;
    let dirty = true;
    let renderedFrames = 0;

    const rectRenderer: RectRenderer = createRectRenderer(gpuState);
    const pageRenderer: PageRenderer = createPageRenderer();
    const objectRenderer: ObjectRenderer = createObjectRenderer();

    const pointer: PointerState = {
        x: 0,
        y: 0,
        inside: false,
        buttons: 0
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

    function pointerMove(x: number, y: number, buttons: number) {
        pointer.x = x;
        pointer.y = y;
        pointer.buttons = buttons;
        pointer.inside = true;
        markDirty();
    }

    function pointerLeave() {
        pointer.inside = false;
        pointer.buttons = 0;
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
        pointerMove,
        pointerLeave,
        getPointerState,
        getRenderedFrames,
        getTransform,
        getPagePlacement,
        screenToPagePoint,
        resetViewToFitPage,
    };
}
