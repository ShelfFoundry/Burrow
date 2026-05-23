import {
    clearFrame,
    resizeCanvasToDisplaySize,
    type WebGpuState,
} from "./webgpu";

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

    getRenderedFrames: ()=>number;
};

export function createViewportLoop(
    canvas: HTMLCanvasElement,
    gpuState: WebGpuState,
): ViewportLoop {
    let animationFrameId = 0;
    let running = false;
    let dirty = true;
    let renderedFrames = 0;

    const pointer: PointerState = {
        x: 0,
        y: 0,
        inside: false,
        buttons: 0
    };

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
            clearFrame(gpuState);
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
    };
}
